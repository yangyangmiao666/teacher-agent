#!/usr/bin/env node
/** 自有源码门禁：包括标识符、注释、字符串与文件名；许可证原件保留。 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const forbidden = [["Z", "Code"].join(""), ["z", "Code"].join("")];
const ignored = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  ".tmp",
  ".cache",
  ".turbo",
  "third-party",
  ".pnpm-store",
  ".run-logs",
  ".worktrees",
  "access-output",
]);
const extensions =
  /\.(ts|tsx|js|jsx|mjs|cjs|json|md|yaml|yml|toml|html|css|sh|svg|txt|xml|swift|cs|manifest|nsh|nsi|patch)$/;
const hits = [];
let scanned = 0;
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.isSymbolicLink()) continue;
    if (entry.name === "build" && !directory.endsWith("packages/desktop")) continue;
    if (/^(?:LICENSE|NOTICE|THIRD-PARTY-NOTICES)(?:\.|$)/i.test(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!extensions.test(entry.name) || entry.name.startsWith(".env")) continue;
    scanned += 1;
    if (forbidden.some((token) => entry.name.includes(token)))
      hits.push(`${relative(root, path)}: forbidden filename`);
    const source = await readFile(path, "utf8");
    source.split(/\r?\n/).forEach((line, index) => {
      if (forbidden.some((token) => line.includes(token)))
        hits.push(`${relative(root, path)}:${index + 1}`);
    });
  }
}
await walk(root);
if (hits.length) {
  console.error(`Forbidden legacy brand in ${hits.length} locations:\n${hits.join("\n")}`);
  process.exitCode = 1;
} else console.log(`OK: ${scanned} own-source files checked (copyright originals retained).`);
