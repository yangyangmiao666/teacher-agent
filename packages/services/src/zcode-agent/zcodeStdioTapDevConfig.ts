import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { JiaoZhiXingStdioTapDevState } from "@zcode/shared";
import { getAppConfigDir } from "#src/paths.js";
import { isEffectiveDevelopmentNodeEnv } from "#src/runtime-tools/nodeEnv.js";

interface JiaoZhiXingStdioTapStateFile {
  enabled?: boolean;
}

function isJiaoZhiXingStdioTapDevVisible(): boolean {
  return isEffectiveDevelopmentNodeEnv();
}

function getJiaoZhiXingStdioTapDevDir(): string {
  return join(getAppConfigDir(), "dev");
}

export function getJiaoZhiXingStdioTapDevLogDir(): string {
  return join(getJiaoZhiXingStdioTapDevDir(), "stdio-traffic");
}

function getJiaoZhiXingStdioTapDevStatePath(): string {
  return join(getJiaoZhiXingStdioTapDevDir(), "zcode-stdio-tap.json");
}

function readStateFile(path: string): JiaoZhiXingStdioTapStateFile {
  if (!existsSync(path)) {
    return {};
  }

  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8")) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as JiaoZhiXingStdioTapStateFile) : {};
  } catch {
    return {};
  }
}

export function readJiaoZhiXingStdioTapDevState(): JiaoZhiXingStdioTapDevState {
  const visible = isJiaoZhiXingStdioTapDevVisible();
  const statePath = getJiaoZhiXingStdioTapDevStatePath();
  const fileState = readStateFile(statePath);
  return {
    enabled: visible && fileState.enabled === true,
    visible,
    logDir: getJiaoZhiXingStdioTapDevLogDir(),
    statePath,
  };
}

export function setJiaoZhiXingStdioTapDevEnabled(enabled: boolean): JiaoZhiXingStdioTapDevState {
  const visible = isJiaoZhiXingStdioTapDevVisible();
  const statePath = getJiaoZhiXingStdioTapDevStatePath();
  mkdirSync(getJiaoZhiXingStdioTapDevDir(), { recursive: true });
  writeFileSync(
    statePath,
    `${JSON.stringify(
      {
        // 开发态 stdio 抓包是高频原始协议帧，只能通过显式开关写旁路文件，避免误进生产日志。
        enabled: visible && enabled,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
  return readJiaoZhiXingStdioTapDevState();
}
