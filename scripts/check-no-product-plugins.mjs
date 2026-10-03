/** 删除验收：产品插件实现及入口必须实际不存在，不能只隐藏菜单。 */
import { access, readFile, readdir } from "node:fs/promises";
const removed = [
  "packages/services/src/plugins",
  "packages/services/src/plugin-sync",
  "packages/shared/src/plugin-types.ts",
  "packages/ui/src/settings/PluginsSection.tsx",
  "packages/ui/src/settings/PluginStorePage.tsx",
  "packages/ui/src/store/pluginManagementStore.ts",
  "packages/ui/src/hooks/usePluginReferenceCatalog.ts",
  "apps/zcode-cli/packages/adapters/src/plugins",
  "apps/zcode-cli/packages/core/src/plugin-reference",
  "apps/zcode-cli/packages/bootstrap/src/plugins.ts",
  "apps/zcode-cli/packages/bootstrap/src/zcode-protocol/plugins.ts",
  "apps/zcode-cli/packages/cli/src/plugins-command.ts",
  "apps/zcode-cli/packages/bootstrap/src/app/bundled-plugins.ts",
  "apps/zcode-cli/packages/contracts/src/plugins",
  "apps/zcode-cli/packages/browser-use-plugin",
  "apps/zcode-cli/packages/node-repl-host",
  "apps/zcode-cli/packages/superpowers-plugin",
];
const failures = [];
for (const path of removed) {
  try {
    await access(path);
    failures.push(`Still exists: ${path}`);
  } catch {}
}
for (const path of [
  "packages/services/src/accessor.ts",
  "packages/shared/src/channels.ts",
  "packages/ui/src/WorkspaceSidebar.tsx",
  "apps/zcode-cli/packages/bootstrap/src/app/create-app.ts",
]) {
  const text = await readFile(path, "utf8");
  if (
    /IPluginsService|IPluginManagementService|IPluginSyncService|pluginManagementService|resolveStartupPlugins|createPluginFacadeForApp|plugin-store-sidebar-open/.test(
      text,
    )
  )
    failures.push(`Plugin wiring: ${path}`);
}
// 遍历接线源代码，防止仅删掉 UI 后仍留下后台服务或协议能力。
async function checkSources(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      await checkSources(path);
      continue;
    }
    if (!/\.(?:ts|tsx)$/.test(path)) continue;
    const source = await readFile(path, "utf8");
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    if (
      /\b(?:pluginsService|pluginSyncService|pluginManagementService|IPluginsService|IPluginSyncService|IPluginManagementService|resolveStartupPlugins|createPluginFacadeForApp)\b|["']plugins\/(?:list|install|enable|disable|remove|sync)["']|scope\s*===\s*["']plugin["']/.test(
        code,
      )
    )
      failures.push(`Plugin runtime wiring: ${path}`);
  }
}
for (const dir of [
  "packages/ui/src",
  "packages/services/src",
  "packages/shared/src",
  "packages/desktop/src",
])
  await checkSources(dir);
const contract = JSON.parse(
  await readFile("apps/zcode-cli/packages/contracts/package.json", "utf8"),
);
if (contract.exports["./plugins"]) failures.push("Plugin contract package export remains");
if (failures.length) {
  process.stderr.write(failures.join("\n") + "\n");
  process.exitCode = 1;
} else process.stdout.write("PASS: product plugin modules and primary wiring removed\n");
