/** 分发包回归：旧插件命令必须被拒绝，不能留空实现或仍可触发安装。 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
const exec = promisify(execFile);
const cli = resolve(import.meta.dirname, "../dist/jzx/agent/zcode.cjs");
const { stdout } = await exec(process.execPath, [cli, "--help"]);
assert.equal(/\bplugins\b|\/plugins/.test(stdout), false);
await assert.rejects(exec(process.execPath, [cli, "plugins", "list"]), (error) => {
  assert.equal(error.code, 1);
  assert.match(error.stderr + error.stdout, /Unknown command: plugins/);
  return true;
});
console.log("PASS: packaged CLI starts, plugin commands are absent and rejected");
