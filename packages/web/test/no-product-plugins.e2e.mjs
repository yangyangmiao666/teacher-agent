import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../desktop/package.json", import.meta.url));
const { chromium } = require("playwright-core");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ locale: "zh-CN", viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto("http://localhost:5173");
  await page
    .getByTestId("test-access-password")
    .fill((await readFile("deploy/access-output/token.txt", "utf8")).trim());
  await page.getByRole("button", { name: "进入教学工作台" }).click();
  await page.getByTestId("teaching-workbench").waitFor();
  await page.locator('[contenteditable="true"]').waitFor();
  assert.equal(await page.getByTestId("plugin-store-sidebar-open").count(), 0);
  assert.equal(await page.getByRole("button", { name: /插件/ }).count(), 0);
  await page.getByRole("button", { name: "设置", exact: true }).click();
  await page.getByTestId("settings-page").waitFor();
  assert.equal(await page.getByRole("button", { name: /插件/ }).count(), 0);
  assert.equal(await page.locator('[data-testid*="plugin"]').count(), 0);
  for (const name of ["技能", "MCP 服务器"]) {
    const nav = page.getByTestId("settings-page").getByRole("button", { name, exact: true });
    {
      assert.equal(await nav.count(), 1, `${name} 原生设置入口应保留`);
      await nav.click();
      await page.getByRole("combobox").count();
      assert.equal((await page.getByTestId("settings-page").innerText()).includes("插件"), false);
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: teaching chat remains mounted; settings and navigation have no product plugin entries",
  );
} finally {
  await browser.close();
}
