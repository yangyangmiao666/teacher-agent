const ZCODE_PROCESS_PREFIX = "zcode";
const MAX_PROCESS_NAME_SEGMENT_LENGTH = 24;

function sanitizeProcessNameSegment(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_PROCESS_NAME_SEGMENT_LENGTH);
}

function joinJiaoZhiXingProcessName(...segments: Array<string | null | undefined>): string {
  const sanitizedSegments = segments
    .map((segment) => sanitizeProcessNameSegment(segment))
    .filter((segment): segment is string => Boolean(segment));
  return [ZCODE_PROCESS_PREFIX, ...sanitizedSegments].join("-");
}

function pickWorkspaceTag(workspacePath: string | null | undefined): string | undefined {
  const trimmedPath = workspacePath?.trim();
  if (!trimmedPath) {
    return undefined;
  }

  const parts = trimmedPath.split(/[\\/]+/).filter(Boolean);
  return parts.at(-1) ?? trimmedPath;
}

export function formatJiaoZhiXingMainProcessName(): string {
  return joinJiaoZhiXingProcessName("main");
}

export function formatJiaoZhiXingGpuProcessName(): string {
  return joinJiaoZhiXingProcessName("gpu");
}

export function formatJiaoZhiXingHostProcessName(label?: string): string {
  return joinJiaoZhiXingProcessName("host", label);
}

export function formatJiaoZhiXingRendererProcessName(windowTitle?: string): string {
  const normalizedTitle = windowTitle?.trim();
  if (!normalizedTitle || normalizedTitle === "JiaoZhiXing") {
    return joinJiaoZhiXingProcessName("renderer", "main");
  }

  if (normalizedTitle === "Resource Manager") {
    return joinJiaoZhiXingProcessName("renderer", "resource-manager");
  }

  const remoteWindowPrefix = "JiaoZhiXing - ";
  if (normalizedTitle.startsWith(remoteWindowPrefix)) {
    return joinJiaoZhiXingProcessName(
      "renderer",
      "remote",
      normalizedTitle.slice(remoteWindowPrefix.length),
    );
  }

  return joinJiaoZhiXingProcessName("renderer", normalizedTitle);
}

export function formatJiaoZhiXingAgentProcessName(provider: string, workspacePath?: string): string {
  return joinJiaoZhiXingProcessName("agent", provider, pickWorkspaceTag(workspacePath));
}

export function formatJiaoZhiXingUtilityProcessName(name?: string, type = "utility"): string {
  return joinJiaoZhiXingProcessName(type, name);
}
