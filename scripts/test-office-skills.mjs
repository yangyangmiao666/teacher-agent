import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const cli = resolve(root, "dist/jzx/agent/zcode.cjs");
const manifest = JSON.parse(
  await readFile(
    resolve(root, "apps/zcode-cli/packages/bundled-skills/office-migration.json"),
    "utf8",
  ),
);
const cwd = await mkdtemp(join(tmpdir(), "jzx-office-discovery-"));
try {
  const { stdout } = await exec(process.execPath, [cli, "skills", "list", "--json"], {
    cwd,
    maxBuffer: 4_000_000,
  });
  const catalog = JSON.parse(stdout);
  // 仅在临时测试工作区禁用同名用户技能，验证内置版本，保留真实用户配置。
  const overrides = Object.fromEntries(
    catalog.skills
      .filter((skill) => skill.source !== "bundled" && manifest.skills.includes(skill.name))
      .map((skill) => [skill.path, { enable: false }]),
  );
  await mkdir(join(cwd, ".zcode"));
  await writeFile(join(cwd, ".zcode/config.json"), JSON.stringify({ skill: overrides }));
  for (const name of manifest.skills) {
    const entry = catalog.skills.find((skill) => skill.name === name && skill.source === "bundled");
    assert.ok(entry, `Packaged discovery must include ${name}`);
    assert.ok(entry.path.startsWith(resolve(root, "dist/jzx/agent/packages/bundled-skills")));
    const inspected = await exec(process.execPath, [cli, "skills", "inspect", name, "--json"], {
      cwd,
      maxBuffer: 4_000_000,
    });
    const result = JSON.parse(inspected.stdout);
    assert.ok(result.skill.content.includes("教智星运行约定"));
    assert.equal(result.skill.truncated, false, `${name} must load completely`);
  }
  console.log(
    `Packaged CLI discovery/load passed: ${manifest.skills.length} office skills outside repository`,
  );
} finally {
  await rm(cwd, { recursive: true, force: true });
}
