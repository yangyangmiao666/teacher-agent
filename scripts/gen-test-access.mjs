#!/usr/bin/env node
/** 生成私有访问说明、可扫码二维码和服务端强制有效期配置。 */
import { randomBytes } from "node:crypto";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import QRCode from "qrcode";

const options = {
  baseUrl: process.env.JZX_PUBLIC_BASE_URL || "http://127.0.0.1:8080",
  days: Number(process.env.JZX_ACCESS_VALID_DAYS || 30),
  outDir: resolve("deploy/access-output"),
};
let localSimplePassword = false;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--local-simple-password") {
    localSimplePassword = true;
    continue;
  }
  if (args[i] === "--help") {
    console.log(
      "Usage: node scripts/gen-test-access.mjs [--base-url URL] [--days N] [--out-dir DIR] [--local-simple-password]. Existing token: JZX_SERVER_AUTH_TOKEN environment variable.",
    );
    process.exit(0);
  }
  const key = { "--base-url": "baseUrl", "--days": "days", "--out-dir": "outDir" }[args[i]];
  const value = args[++i];
  if (!key || !value || value.startsWith("--"))
    throw new Error("Unknown argument or missing value");
  options[key] = key === "days" ? Number(value) : value;
}
if (!Number.isInteger(options.days) || options.days < 1 || options.days > 365)
  throw new Error("--days must be an integer from 1 to 365");
const url = new URL(options.baseUrl);
if (
  !["http:", "https:"].includes(url.protocol) ||
  url.username ||
  url.password ||
  url.search ||
  url.hash ||
  url.pathname !== "/"
)
  throw new Error("--base-url must be an HTTP(S) origin without credentials, query or fragment");
const base = url.origin;
const token = process.env.JZX_SERVER_AUTH_TOKEN?.trim() || randomBytes(32).toString("base64url");
// 用户要求本地易输入口令；仅显式启用且为回环地址时放宽，避免公网意外使用短口令。
if (localSimplePassword && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
  throw new Error("Simple passwords are only permitted for loopback test URLs");
if (!(localSimplePassword ? /^[A-Za-z0-9_-]{6,}$/ : /^[A-Za-z0-9_-]{24,}$/).test(token))
  throw new Error(
    `Token must contain at least ${localSimplePassword ? 6 : 24} URL-safe characters`,
  );
const issuedAt = new Date();
const expiresAt = new Date(issuedAt.getTime() + options.days * 86400000).toISOString();
const accessUrl = `${base}/?token=${encodeURIComponent(token)}`;
// 二维码失败时不生成声称可扫码的替代物；不调用在线服务，不泄露凭据。
const png = await QRCode.toBuffer(accessUrl, {
  type: "png",
  width: 512,
  margin: 4,
  errorCorrectionLevel: "M",
});
await mkdir(options.outDir, { recursive: true, mode: 0o700 });
const outputs = {
  "access.env": `JZX_SERVER_AUTH_TOKEN=${token}\nJZX_SERVER_AUTH_EXPIRES_AT=${expiresAt}\n`,
  "token.txt": `${token}\n`,
  "qrcode.png": png,
  "ACCESS.md": `# 教智星测试访问说明（私有，仅发受信评审）

| 项 | 内容 |
| --- | --- |
| 测试地址 | ${base} |
| 一键访问链接 | ${accessUrl} |
| 访问方式 | 限时共享访问令牌，无独立用户名 |
| 访问凭据（等同密码） | ${token} |
| 权限 | 部署容器内教学 Agent、文件、终端能力；非多租户只读访客 |
| 签发时间（UTC） | ${issuedAt.toISOString()} |
| 有效期至（UTC） | ${expiresAt} |
| 到期执行 | 服务端拒绝 API/WS 请求并断开已有 WS；已运行任务由运维停止 |
| 数据 | 仅虚构或脱敏演示课程，未连接真实学生/企业/校内平台 |
| 核验状态 | 仅生成配置，尚未证明公网部署可访问 |

扫码打开 qrcode.png 对应的链接即可连接服务。二维码与链接含凭据，须私下发送。
复制 access.env 中两项到 deploy/.env 后重建服务；日期写入说明书并不能替代服务端配置。
上线后须实测：首页、教学子台、模型生成、文件产出、过期拒绝；记录核验日期再将链接列入正式材料。
`,
};
for (const [name, content] of Object.entries(outputs)) {
  const path = join(options.outDir, name);
  await writeFile(path, content, { mode: 0o600 });
  await chmod(path, 0o600);
}
console.log(
  `Private access files written to ${resolve(options.outDir)}. Expiry (UTC): ${expiresAt}. Credential not logged.`,
);
