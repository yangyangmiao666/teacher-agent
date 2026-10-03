import { basename, dirname } from "node:path";
import { type CustomCommandContent, type ExecutionPort, type ExecutionResult, type TraceContext } from "@zcode/contracts";

const DEFAULT_SHELL_EXPANSION_TIMEOUT_MS = 30_000;
const DEFAULT_SHELL_EXPANSION_OUTPUT_BYTES = 128 * 1024;

const INLINE_SHELL_PATTERN = /!`([^`]*)`/gu;
const FENCED_SHELL_PATTERN = /```!\s*\r?\n?([\s\S]*?)```/gu;
const SHELL_CONTEXT_VARIABLE_PATTERN =
  /\$\{(CLAUDE_CODE_SESSION_ID|CLAUDE_PROJECT_DIR|CLAUDE_SESSION_ID|CLAUDE_SKILL_DIR|ZCODE_PROJECT_DIR|ZCODE_SESSION_ID|ZCODE_SKILL_DIR)\}/gu;

interface ShellExpansionMatch {
  command: string;
  end: number;
  start: number;
  type: "fenced" | "inline";
}

export async function expandCustomCommandShellSyntax(input: {
  command: CustomCommandContent;
  content: string;
  executionPort: ExecutionPort;
  sessionId?: string;
  signal?: AbortSignal;
  traceContext?: TraceContext;
  workingDirectory: string;
}): Promise<string> {
  let cursor = 0;
  let output = "";

  for (const match of collectShellExpansionMatches(input.content)) {
    output += input.content.slice(cursor, match.start);
    output += await runShellExpansion({
      ...input,
      shellCommand: match.command,
      type: match.type,
    });
    cursor = match.end;
  }

  output += input.content.slice(cursor);
  return output;
}

function collectShellExpansionMatches(content: string): ShellExpansionMatch[] {
  const matches: ShellExpansionMatch[] = [];
  let cursor = 0;

  while (cursor < content.length) {
    INLINE_SHELL_PATTERN.lastIndex = cursor;
    FENCED_SHELL_PATTERN.lastIndex = cursor;

    const inline = INLINE_SHELL_PATTERN.exec(content);
    const fenced = FENCED_SHELL_PATTERN.exec(content);
    const next = pickNextMatch(inline, fenced);
    if (!next) break;

    matches.push(next);
    cursor = next.end;
  }

  INLINE_SHELL_PATTERN.lastIndex = 0;
  FENCED_SHELL_PATTERN.lastIndex = 0;
  return matches;
}

function pickNextMatch(
  inline: RegExpExecArray | null,
  fenced: RegExpExecArray | null,
): ShellExpansionMatch | null {
  if (!inline && !fenced) return null;
  if (fenced && (!inline || fenced.index <= inline.index)) {
    return {
      command: normalizeFencedShellCommand(fenced[1] ?? ""),
      end: fenced.index + fenced[0].length,
      start: fenced.index,
      type: "fenced",
    };
  }
  if (!inline) return null;
  return {
    command: (inline[1] ?? "").trim(),
    end: inline.index + inline[0].length,
    start: inline.index,
    type: "inline",
  };
}

function normalizeFencedShellCommand(command: string): string {
  return command.replace(/^\r?\n/u, "").replace(/\r?\n$/u, "").trim();
}

async function runShellExpansion(input: {
  command: CustomCommandContent;
  env?: NodeJS.ProcessEnv;
  executionPort: ExecutionPort;
  sessionId?: string;
  shellCommand: string;
  signal?: AbortSignal;
  traceContext?: TraceContext;
  type: "fenced" | "inline";
  workingDirectory: string;
}): Promise<string> {
  if (input.shellCommand.length === 0) return "";
  assertShellExpansionContextAvailable({
    command: input.command,
    sessionId: input.sessionId,
    shellCommand: input.shellCommand,
  });

  const result = await input.executionPort.run(
    {
      command: {
        mode: "shell",
        command: input.shellCommand,
      },
      cwd: input.workingDirectory,
      env: createShellExpansionEnv({
        sessionId: input.sessionId,
        workingDirectory: input.workingDirectory,
      }),
      outputLimit: {
        maxBufferBytes: DEFAULT_SHELL_EXPANSION_OUTPUT_BYTES,
        maxInlineBytes: DEFAULT_SHELL_EXPANSION_OUTPUT_BYTES,
        persistOutput: "none",
      },
      timeoutMs: DEFAULT_SHELL_EXPANSION_TIMEOUT_MS,
      ...(input.traceContext
        ? {
            trace: {
              ...input.traceContext,
              attributes: {
                ...input.traceContext.attributes,
                customCommandName: input.command.metadata.name,
                customCommandShellExpansion: input.type,
              },
            },
          }
        : {}),
    },
    { signal: input.signal },
  );

  if (result.status === "completed" && (result.exitCode ?? 0) === 0) {
    return result.stdout.text.trimEnd();
  }

  throw new Error(formatShellExpansionError(input.command, input.shellCommand, result));
}

function createShellExpansionEnv(input: {
  sessionId: string | undefined;
  workingDirectory: string;
}) {
  const set: Record<string, string> = {};
  set.CLAUDE_PROJECT_DIR = input.workingDirectory;
  set.ZCODE_PROJECT_DIR = input.workingDirectory;
  if (input.sessionId) {
    set.CLAUDE_CODE_SESSION_ID = input.sessionId;
    set.CLAUDE_SESSION_ID = input.sessionId;
    set.ZCODE_SESSION_ID = input.sessionId;
  }
  return Object.keys(set).length > 0 ? { set } : undefined;
}

function assertShellExpansionContextAvailable(input: {
  command: CustomCommandContent;
  sessionId: string | undefined;
  shellCommand: string;
}): void {
  for (const match of input.shellCommand.matchAll(SHELL_CONTEXT_VARIABLE_PATTERN)) {
    const name = match[1];
    if (!name) continue;
    if (name === "CLAUDE_SKILL_DIR" || name === "ZCODE_SKILL_DIR") {
      throw new Error(
        `Custom command /${input.command.metadata.name} variable requires a skill context: ${name}`,
      );
    }
    if (
      !input.sessionId &&
      (name === "CLAUDE_CODE_SESSION_ID" ||
        name === "CLAUDE_SESSION_ID" ||
        name === "ZCODE_SESSION_ID")
    ) {
      throw new Error(
        `Custom command /${input.command.metadata.name} variable requires a runtime session context: ${name}`,
      );
    }
  }
  SHELL_CONTEXT_VARIABLE_PATTERN.lastIndex = 0;
}

function formatShellExpansionError(
  command: CustomCommandContent,
  shellCommand: string,
  result: ExecutionResult,
): string {
  const details =
    result.error?.message ||
    trimPreview(result.stderr.text) ||
    trimPreview(result.stdout.text) ||
    `status=${result.status}`;
  return [
    `Custom command /${command.metadata.name} shell expansion failed.`,
    `Command: ${shellCommand}`,
    `Exit: ${result.exitCode ?? result.status}`,
    `Details: ${details}`,
  ].join("\n");
}

function trimPreview(value: string): string {
  return value.trim().slice(0, 2_000);
}
