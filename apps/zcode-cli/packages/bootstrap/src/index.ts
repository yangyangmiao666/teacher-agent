// Bootstrap public API surface.

export * from "./app/create-app.js";
export type {
  ListJiaoZhiXingSessionsOptions,
  PromptInput,
  ResolveLatestSessionOptions,
  ResumeOptions,
  RunJiaoZhiXingProtocolAgentOptions,
  SendInputOptions,
  SendInputResult,
  SetLocaleResult,
  SteerTurnOptions,
  SubmitPromptOptions,
  UserPromptInput,
  JiaoZhiXingApp,
  JiaoZhiXingAppOptions,
  JiaoZhiXingModelOption,
} from "./app/types.js";
export * from "./auth-login.js";
export {
  inspectJiaoZhiXingCustomCommand,
  listJiaoZhiXingCustomCommands,
  loadJiaoZhiXingCustomCommand,
} from "./custom-commands.js";
export type {
  InspectJiaoZhiXingCustomCommandOptions,
  ListJiaoZhiXingCustomCommandsOptions,
  JiaoZhiXingCustomCommandInspection,
} from "./custom-commands.js";
export { createModelAdapter } from "./model-factory.js";
export type { CreateModelAdapterOptions } from "./model-factory.js";
export { startProcessProviderRegistryRuntime } from "./app/process-provider-registry-runtime.js";
export type { ProcessProviderRegistryRuntimeOptions } from "./app/process-provider-registry-runtime.js";
export { runJiaoZhiXingProtocolAgent } from "./zcode-protocol-entrypoint.js";
// Exposed for the CLI's --output-format stream-json: it needs the same event
// shape the protocol server emits, rather than inventing a second one.
export { mapSessionEvent } from "./zcode-protocol/session-mapper.js";
export { prepareJiaoZhiXingTelemetryEnv, shutdownJiaoZhiXingTelemetry } from "./telemetry-bootstrap.js";
export type { SessionTranscriptMessage, SessionTranscriptPart } from "./session-transcript.js";
export { listJiaoZhiXingSessions, resolveLatestSession } from "./sessions.js";
export { inspectJiaoZhiXingSkill, listJiaoZhiXingSkills } from "./skills.js";
export type {
  InspectJiaoZhiXingSkillOptions,
  ListJiaoZhiXingSkillsOptions,
  JiaoZhiXingSkillInspection,
} from "./skills.js";
// Exposed for the CLI's headless slash routing: it must decide "is this a real
// custom command?" with the *same* reserved-name gate the app facade's
// customCommandPromptResolver applies, or the two disagree and a reserved name
// reaches the model as literal prompt text. See prompt-command.ts.
export { isReservedJiaoZhiXingSlashCommandName } from "./slash-command-surface.js";
export {
  grantWorkspaceHookTrust,
  inspectWorkspaceHookTrust,
  revokeWorkspaceHookTrustCli,
} from "./workspace-hook-trust-cli.js";
export type {
  WorkspaceHookTrustCliItem,
  WorkspaceHookTrustCliStatus,
  WorkspaceHookTrustCliTarget,
} from "./workspace-hook-trust-cli.js";
