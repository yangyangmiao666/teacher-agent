import { z } from "zod";
import type { CommandAgentSource } from "./command-types.js";
import type { JiaoZhiXingProvider } from "./zcode-task-types-core.js";

export const ZCODE_AGENT_PROVIDER = "glm" satisfies JiaoZhiXingProvider;
export const ZCODE_AGENT_PROVIDER_LABEL = "JiaoZhiXing Agent";
export const ZCODE_COMMAND_AGENT_SOURCE = "zcodeAgent" satisfies CommandAgentSource;

export const zcodeAgentProviderSchema = z.literal(ZCODE_AGENT_PROVIDER);

export const ZCODE_COMMAND_AGENT_SOURCES = [
  ZCODE_COMMAND_AGENT_SOURCE,
] as const satisfies readonly CommandAgentSource[];

export function normalizeAgentProviderToJiaoZhiXingAgent(
  _provider?: JiaoZhiXingProvider | null,
): JiaoZhiXingProvider {
  return ZCODE_AGENT_PROVIDER;
}

export function isJiaoZhiXingAgentProvider(
  provider: JiaoZhiXingProvider | null | undefined,
): provider is typeof ZCODE_AGENT_PROVIDER {
  return provider === ZCODE_AGENT_PROVIDER;
}
