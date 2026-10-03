import { DEFAULT_ZCODE_ENDPOINT_ORIGIN } from "./zcodeEndpoint.js";

export const ZCODE_SOURCE_HEADERS = {
  "User-Agent": "JiaoZhiXing/unknown",
  "HTTP-Referer": DEFAULT_ZCODE_ENDPOINT_ORIGIN,
  "X-Title": "Z Code@electron",
} as const;

export interface BuildJiaoZhiXingSourceHeadersFromContextOptions {
  appVersion?: string;
  arch?: string;
  clientLanguage?: string;
  clientTimezone?: string;
  deviceMid?: string;
  endpointOrigin?: string;
  osVersion?: string;
  platform?: string;
  releaseChannel?: string;
  sourceTitle?: string;
}

export function normalizeJiaoZhiXingSourceHeaderValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !/^[\x20-\x7e]+$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export function buildJiaoZhiXingSourceHeadersFromContext(
  options: BuildJiaoZhiXingSourceHeadersFromContextOptions = {},
): Record<string, string> {
  const appVersion = normalizeJiaoZhiXingSourceHeaderValue(options.appVersion);
  const arch = normalizeJiaoZhiXingSourceHeaderValue(options.arch);
  const clientLanguage = normalizeJiaoZhiXingSourceHeaderValue(options.clientLanguage) ?? "unknown";
  const clientTimezone = normalizeJiaoZhiXingSourceHeaderValue(options.clientTimezone) ?? "unknown";
  const deviceMid = normalizeJiaoZhiXingSourceHeaderValue(options.deviceMid);
  const endpointOrigin =
    normalizeJiaoZhiXingSourceHeaderValue(options.endpointOrigin) ?? DEFAULT_ZCODE_ENDPOINT_ORIGIN;
  const osVersion = normalizeJiaoZhiXingSourceHeaderValue(options.osVersion);
  const platform = normalizeJiaoZhiXingSourceHeaderValue(options.platform);
  const releaseChannel = normalizeJiaoZhiXingSourceHeaderValue(options.releaseChannel);
  const sourceTitle = normalizeJiaoZhiXingSourceHeaderValue(options.sourceTitle) ?? "electron";

  return {
    ...ZCODE_SOURCE_HEADERS,
    "HTTP-Referer": endpointOrigin,
    "User-Agent": `JiaoZhiXing/${appVersion ?? "unknown"}`,
    ...(appVersion ? { "X-JiaoZhiXing-App-Version": appVersion } : {}),
    "X-Title": `Z Code@${sourceTitle}`,
    ...(platform && arch ? { "X-Platform": `${platform}-${arch}` } : {}),
    ...(releaseChannel ? { "X-Release-Channel": releaseChannel } : {}),
    "X-Client-Language": clientLanguage,
    "X-Client-Timezone": clientTimezone,
    ...(platform ? { "X-Os-Category": normalizeOsCategory(platform) } : {}),
    ...(osVersion ? { "X-Os-Version": osVersion } : {}),
    ...(deviceMid ? { "X-Device-Mid": deviceMid } : {}),
  };
}

function normalizeOsCategory(platform: string): string {
  switch (platform) {
    case "darwin":
      return "macos";
    case "win32":
      return "windows";
    default:
      return "linux";
  }
}
