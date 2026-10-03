import { createLocalServices, getAppConfigDir } from "@zcode/services/node";
import {
  materializeBundledJiaoZhiXingBuiltinProviderConfig,
  readBundledJiaoZhiXingBuiltinProviderConfig,
} from "./bundledJiaoZhiXingBuiltinProviderConfig.js";
import { createHttpServer } from "./http.js";
import { parseAccessExpiry } from "./webAccess.js";

async function main(): Promise<void> {
  const zcodeBuiltinProviderConfigFilePath =
    await materializeBundledJiaoZhiXingBuiltinProviderConfig({
      environmentConfigRoot: getAppConfigDir(),
      content: readBundledJiaoZhiXingBuiltinProviderConfig(),
    });
  const port = Number(process.env["PORT"]) || 3030;
  const host =
    process.env["JZX_SERVER_HOST"]?.trim() ||
    process.env["ZCODE_SERVER_HOST"]?.trim() ||
    process.env["HOST"]?.trim() ||
    undefined;
  const staticRoot =
    process.env["JZX_WEB_STATIC_ROOT"]?.trim() ||
    process.env["ZCODE_WEB_STATIC_ROOT"]?.trim() ||
    undefined;
  const authToken =
    process.env["JZX_SERVER_AUTH_TOKEN"]?.trim() ||
    process.env["ZCODE_SERVER_AUTH_TOKEN"]?.trim() ||
    undefined;
  const authExpiresAt = parseAccessExpiry(process.env["JZX_SERVER_AUTH_EXPIRES_AT"]);
  const services = createLocalServices({
    zcodeBuiltinProviderConfigFilePath,
    providerProvisioningTargetEnabled: Boolean(authToken),
  });

  createHttpServer(services, port, {
    ...(host ? { host } : {}),
    ...(staticRoot ? { staticRoot, spaFallback: true } : {}),
    ...(authToken ? { authToken, authRequired: true } : {}),
    ...(authExpiresAt !== undefined ? { authExpiresAt } : {}),
  });
}

void main().catch((error: unknown) => {
  console.error("[zcode-server:http] startup failed", error);
  process.exitCode = 1;
});
