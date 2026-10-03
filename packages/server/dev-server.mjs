/** 开发入口复用私有测试配置，避免 Vite 代理命中无鉴权服务。 */
import { readFile } from "node:fs/promises";
import { parse } from "dotenv";

const config = parse(
  await readFile(new URL("../../deploy/access-output/access.env", import.meta.url)),
);
for (const key of ["JZX_SERVER_AUTH_TOKEN", "JZX_SERVER_AUTH_EXPIRES_AT"]) {
  const value = process.env[key]?.trim() || config[key]?.trim();
  if (!value)
    throw new Error("Missing private test access configuration; run pnpm gen:test-access first");
  process.env[key] = value;
}
await import("./dist/entry-http.js");
