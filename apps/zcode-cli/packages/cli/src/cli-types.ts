import type { TuiReadClipboardImage, TuiWriteClipboardText } from "@zcode/tui";
import type { UiLocale } from "@zcode/i18n";
import type { Logger } from "@zcode/contracts";
import type {
  createManagedCdpBrowserRuntime,
  ManagedCdpBrowserRuntimeOptions,
} from "@zcode/adapters/browser";
import type {
  createModelAdapter,
  createJiaoZhiXingApp,
  CreateModelAdapterOptions,
  configureCodingPlanApiKey,
  ConfigureCodingPlanApiKeyOptions,
  inspectJiaoZhiXingSkill,
  inspectWorkspaceHookTrust,
  grantWorkspaceHookTrust,
  revokeWorkspaceHookTrustCli,
  inspectJiaoZhiXingCustomCommand,
  InspectJiaoZhiXingCustomCommandOptions,
  InspectJiaoZhiXingSkillOptions,
  loginJiaoZhiXingCli,
  loginBigmodelCodingPlan,
  LoginBigmodelCodingPlanOptions,
  LoginJiaoZhiXingCliOptions,
  listJiaoZhiXingCustomCommands,
  ListJiaoZhiXingCustomCommandsOptions,
  loadJiaoZhiXingCustomCommand,
  listJiaoZhiXingSessions,
  listJiaoZhiXingSkills,
  ListJiaoZhiXingSessionsOptions,
  ListJiaoZhiXingSkillsOptions,
  logoutJiaoZhiXingCli,
  LogoutJiaoZhiXingCliOptions,
  resolveLatestSession,
  ResolveLatestSessionOptions,
  RunJiaoZhiXingProtocolAgentOptions,
  prepareJiaoZhiXingTelemetryEnv,
  startProcessProviderRegistryRuntime,
  shutdownJiaoZhiXingTelemetry,
  JiaoZhiXingAppOptions,
} from "@zcode/bootstrap";
import type { CliEnv, DotenvLoadResult, LoadCliDotenvOptions } from "./env.js";
import type { CliShutdownProcess } from "./shutdown.js";
import type { resolveWorkspaceGitBranch } from "./tui-workspace-git.js";

export type BootstrapModule = typeof import("@zcode/bootstrap");

export interface RunDependencies {
  protocolLifecycle?: RunJiaoZhiXingProtocolAgentOptions["lifecycle"];
  protocolInput?: NodeJS.ReadableStream;
  createManagedCdpBrowserRuntime?: (
    options?: ManagedCdpBrowserRuntimeOptions,
  ) => ReturnType<typeof createManagedCdpBrowserRuntime>;
  createModelAdapter?: (
    options?: CreateModelAdapterOptions,
  ) => ReturnType<typeof createModelAdapter>;
  createJiaoZhiXingApp?: (
    options?: JiaoZhiXingAppOptions,
  ) => Awaited<ReturnType<typeof createJiaoZhiXingApp>> | ReturnType<typeof createJiaoZhiXingApp>;
  /**
   * Session-event shaper for --output-format stream-json. Defaults to the
   * bootstrap module's, which is also what the protocol server uses; injectable
   * so a caller that supplies its own `createJiaoZhiXingApp` (tests, embedders) can
   * still stream, since the bootstrap module is not loaded on that path.
   */
  mapSessionEvent?: BootstrapModule["mapSessionEvent"];
  cwd?: () => string;
  env?: CliEnv;
  inspectSkill?: (options: InspectJiaoZhiXingSkillOptions) => ReturnType<typeof inspectJiaoZhiXingSkill>;
  inspectWorkspaceHookTrust?: typeof inspectWorkspaceHookTrust;
  grantWorkspaceHookTrust?: typeof grantWorkspaceHookTrust;
  revokeWorkspaceHookTrustCli?: typeof revokeWorkspaceHookTrustCli;
  inspectCustomCommand?: (
    options: InspectJiaoZhiXingCustomCommandOptions,
  ) => ReturnType<typeof inspectJiaoZhiXingCustomCommand>;
  loginJiaoZhiXingCli?: (options?: LoginJiaoZhiXingCliOptions) => ReturnType<typeof loginJiaoZhiXingCli>;
  loginBigmodelCodingPlan?: (
    options?: LoginBigmodelCodingPlanOptions,
  ) => ReturnType<typeof loginBigmodelCodingPlan>;
  configureCodingPlanApiKey?: (
    options: ConfigureCodingPlanApiKeyOptions,
  ) => ReturnType<typeof configureCodingPlanApiKey>;
  loadDotenv?: (options?: LoadCliDotenvOptions) => DotenvLoadResult;
  prepareJiaoZhiXingTelemetryEnv?: typeof prepareJiaoZhiXingTelemetryEnv;
  projectConfigPath?: string;
  listSessions?: (options: ListJiaoZhiXingSessionsOptions) => ReturnType<typeof listJiaoZhiXingSessions>;
  listCustomCommands?: (
    options: ListJiaoZhiXingCustomCommandsOptions,
  ) => ReturnType<typeof listJiaoZhiXingCustomCommands>;
  loadCustomCommand?: (
    options: InspectJiaoZhiXingCustomCommandOptions,
  ) => ReturnType<typeof loadJiaoZhiXingCustomCommand>;
  // headless slash 路由要和 app facade 的保留名 gate 用同一个判据；默认取 bootstrap 的，
  // 注入点只为让单测不必拉起整个 bootstrap 模块。见 prompt-command.ts。
  isReservedSlashCommandName?: BootstrapModule["isReservedJiaoZhiXingSlashCommandName"];
  listSkills?: (options: ListJiaoZhiXingSkillsOptions) => ReturnType<typeof listJiaoZhiXingSkills>;
  logger?: Logger;
  readClipboardImage?: TuiReadClipboardImage;
  writeClipboardText?: TuiWriteClipboardText;
  resolveLatestSession?: (
    options: ResolveLatestSessionOptions,
  ) => ReturnType<typeof resolveLatestSession>;
  resolveWorkspaceGitBranch?: typeof resolveWorkspaceGitBranch;
  logoutJiaoZhiXingCli?: (options?: LogoutJiaoZhiXingCliOptions) => ReturnType<typeof logoutJiaoZhiXingCli>;
  runJiaoZhiXingProtocolAgent?: (options?: RunJiaoZhiXingProtocolAgentOptions) => Promise<void>;
  runTui?: typeof import("@zcode/tui").runTui;
  skipUserConfig?: boolean;
  userConfigPath?: string;
  exitProcess?: (code: number) => void;
  shutdownCleanupTimeoutMs?: number;
  shutdownProcess?: CliShutdownProcess;
  startProcessProviderRegistryRuntime?: typeof startProcessProviderRegistryRuntime;
  shutdownJiaoZhiXingTelemetry?: typeof shutdownJiaoZhiXingTelemetry;
}

export type CliPermissionMode = "build" | "plan" | "edit" | "yolo";
export type CliRuntimeMode = CliPermissionMode | "auto";

export interface CliModeState {
  current?: CliRuntimeMode;
  override?: CliPermissionMode;
}

export interface CliTargetRequest {
  objective: string;
  replaceExisting: boolean;
}

export type ModeCapableApp = Awaited<ReturnType<typeof createJiaoZhiXingApp>> & {
  getMode?: () => CliRuntimeMode;
  setLocale?: (locale: UiLocale) => Promise<{ locale: "en-US" | "zh-CN" }>;
  setMode?: (mode: CliRuntimeMode) => Promise<{ mode: CliRuntimeMode }>;
};

export interface CliResumeRequest {
  continueSession: boolean;
  resumeSessionId?: string;
}
