import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { migrateUserSubagentMarkdown, migrateSubagentStateFile } from "@zcode/shared/node";
import {
  parseAgentProfileFromMarkdown,
  type AgentProfile,
  type AgentProfileParseDiagnostic,
} from "@zcode/core";
import type { Logger } from "@zcode/contracts";
import { createAgentStateId, modelSelectionSchema, type BuiltInSubagentModelSelectionOverrides, type BuiltInSubagentName } from "@zcode/shared";

interface LoadJiaoZhiXingAgentProfilesInput {
  logger?: Logger;
  storageRoot: string;
  workingDirectory: string;
}

interface LoadJiaoZhiXingAgentProfilesResult {
  builtInModelSelectionOverrides: BuiltInSubagentModelSelectionOverrides;
  diagnostics: AgentProfileParseDiagnostic[];
  profiles: AgentProfile[];
}

const RESERVED_AGENT_NAMES = new Set(["general-purpose", "Explore"]);

export async function loadJiaoZhiXingAgentProfiles(
  input: LoadJiaoZhiXingAgentProfilesInput,
): Promise<LoadJiaoZhiXingAgentProfilesResult> {
  const migration = await migrateUserSubagentMarkdown(join(input.storageRoot, "agents"));
  await migrateSubagentStateFile(join(input.storageRoot, "v2", "agents-state.json"));
  const roots = [
    { path: join(input.storageRoot, "agents"), source: "user" as const },
    { path: join(input.workingDirectory, ".zcode", "agents"), source: "project" as const },
  ];
  const diagnostics: AgentProfileParseDiagnostic[] = [];
  for (const failure of migration.failures) {
    diagnostics.push({
      code: "agent_read_failed",
      message: "Subagent Markdown migration failed; original file preserved",
      path: failure.path,
    });
    input.logger?.warn("Subagent Markdown migration failed", {
      module: "bootstrap.subagents",
      path: failure.path,
      error: String(failure.error),
    });
  }
  const agentState = readAgentState(input.storageRoot);
  const profiles: AgentProfile[] = [];

  for (const root of roots) {
    for (const filePath of listMarkdownFiles(root.path)) {
      const content = readFileSync(filePath, "utf8");
      const result = parseAgentProfileFromMarkdown({
        content,
        path: filePath,
        source: root.source,
      });
      if (result.diagnostic) {
        diagnostics.push(result.diagnostic);
        input.logger?.warn("Agent profile diagnostic", {
          code: result.diagnostic.code,
          message: result.diagnostic.message,
          module: "bootstrap.subagents",
          path: filePath,
        });
      }
      if (result.profile) {
        const profile = sanitizeProjectAgentProfile(result.profile);
        if (isDisabledUserProfile(profile, agentState.disabledAgentIds)) {
          continue;
        }
        profiles.push(profile);
      }
    }
  }

  input.logger?.debug("Agent profiles loaded", {
    diagnosticCount: diagnostics.length,
    module: "bootstrap.subagents",
    profileCount: profiles.length,
  });

  return {
    builtInModelSelectionOverrides: agentState.builtInModelSelectionOverrides,
    diagnostics,
    profiles,
  };
}

function sanitizeProjectAgentProfile(profile: AgentProfile): AgentProfile {
  if (profile.source !== "project" || profile.permissionMode === undefined) {
    return profile;
  }

  // 项目级 .zcode/agents/*.md 是仓库内容，不能通过 frontmatter
  // 把 child runtime 切到 bypass/yolo；用户级与受信插件 profile 不受影响。
  const { permissionMode: _permissionMode, ...safeProfile } = profile;
  return safeProfile;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}



function readAgentState(storageRoot: string): {
  builtInModelSelectionOverrides: BuiltInSubagentModelSelectionOverrides;
  disabledAgentIds: Set<string>;
} {
  try {
    const raw = readFileSync(join(storageRoot, "v2", "agents-state.json"), "utf8");
    const parsed = JSON.parse(raw) as {
      builtInModelSelectionOverrides?: unknown;
      disabledAgentIds?: unknown;
    };
    return {
      builtInModelSelectionOverrides: normalizeBuiltInSelectionOverrides(
        parsed.builtInModelSelectionOverrides,
      ),
      disabledAgentIds: new Set(
        Array.isArray(parsed.disabledAgentIds)
          ? parsed.disabledAgentIds.filter(
              (id): id is string => typeof id === "string" && id.trim().length > 0,
            )
          : [],
      ),
    };
  } catch {
    return {
      builtInModelSelectionOverrides: {},
      disabledAgentIds: new Set(),
    };
  }
}

function normalizeBuiltInSelectionOverrides(
  structured: unknown,
): BuiltInSubagentModelSelectionOverrides {
  const result: BuiltInSubagentModelSelectionOverrides = {};
  const structuredRecord = isRecord(structured) ? structured : {};
  const generalPurpose = modelSelectionSchema.safeParse(structuredRecord["general-purpose"]);
  const explore = modelSelectionSchema.safeParse(structuredRecord.Explore);
  if (generalPurpose.success) result["general-purpose"] = generalPurpose.data;
  if (explore.success) result.Explore = explore.data;
  return result;
}

function isDisabledUserProfile(
  profile: AgentProfile,
  disabledAgentIds: ReadonlySet<string>,
): boolean {
  if (profile.source !== "user") {
    return false;
  }
  return disabledAgentIds.has(
    createAgentStateId({
      name: profile.name,
      scope: "user",
      source: "user",
    }),
  );
}

function listMarkdownFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  if (!statSync(root).isDirectory()) return [];

  const result: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      result.push(...listMarkdownFiles(path));
      continue;
    }
    if (entry.isFile() && /\.(md|markdown)$/iu.test(entry.name)) {
      result.push(path);
    }
  }
  return result.sort((left, right) => left.localeCompare(right));
}
