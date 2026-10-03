/** Vite 测试夹具使用真实完成态提交入口；不模拟或宣称模型调用。 */
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../desktop/package.json", import.meta.url));
const { chromium } = require("playwright-core");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.JZX_TEST_BROWSER_CHANNEL
    ? { channel: process.env.JZX_TEST_BROWSER_CHANNEL }
    : {}),
});
const page = await browser.newPage({ locale: "zh-CN", viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://localhost:5173/");
  await page
    .getByTestId("test-access-password")
    .fill((await readFile("deploy/access-output/token.txt", "utf8")).trim());
  await page.getByRole("button", { name: "进入教学工作台" }).click();
  await page.getByTestId("teaching-workbench").waitFor();
  await page.getByRole("button", { name: "查看互动示例（非模型生成）" }).click();
  const canvas = page.getByTestId("teaching-canvas");
  await canvas.locator("svg").filter({ hasText: "传热机制" }).waitFor();
  await canvas.locator(".katex").nth(1).waitFor();
  await canvas.getByRole("columnheader", { name: "符号" }).waitFor();
  await canvas.getByRole("textbox", { name: /需要重点讲解/ }).fill("努塞尔数与边界层");
  await canvas.getByRole("button", { name: /生成再教学活动/ }).click();
  const composer = page.locator('[contenteditable="true"]').last();
  await composer.getByText(/努塞尔数与边界层/).waitFor();
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("contenteditable") === "true",
  );
  await canvas.locator("iframe").scrollIntoViewIfNeeded();
  await page
    .frameLocator('iframe[title="教学 HTML / Teaching HTML"]')
    .getByRole("button", { name: "生成辨析题" })
    .click();
  await composer.getByText(/请生成一道努塞尔数辨析题/).waitFor();
  await page.reload();
  await canvas.waitFor();
  await canvas.getByRole("textbox", { name: /需要重点讲解/ }).waitFor();
  // 用已知测试回复走教师导入与 projection 共用的校验提交入口；不声称模型生成。
  await canvas.getByRole("button", { name: "源代码" }).click();
  const reply =
    "```jzx-ui\n" +
    JSON.stringify({
      title: "测试回复生成的界面",
      components: [
        {
          id: "root",
          component: "Html",
          html: '<h2>隔离 HTML</h2><script>parent.document.body.dataset.compromised="yes"</script><button data-jzx-prompt="请展开这个教学案例">展开案例</button>',
        },
      ],
    }) +
    "\n```";
  await canvas.getByRole("textbox", { name: "画布源代码" }).fill(reply);
  await canvas.getByRole("button", { name: "更新画布" }).click();
  await canvas.getByRole("heading", { name: "测试回复生成的界面" }).waitFor();
  assert.equal(await page.evaluate(() => document.body.dataset.compromised), undefined);
  assert.equal(await page.locator("iframe").first().getAttribute("sandbox"), "allow-scripts");
  await canvas.locator("iframe").scrollIntoViewIfNeeded();
  await page
    .frameLocator('iframe[title="教学 HTML / Teaching HTML"]')
    .getByRole("button", { name: "展开案例" })
    .click();
  await composer.getByText(/请展开这个教学案例/).waitFor();
  await canvas.getByRole("button", { name: "撤销画布" }).click();
  await canvas.getByRole("heading", { name: /传热教学互动示例/ }).waitFor();
  await page.reload();
  await canvas.getByRole("heading", { name: /传热教学互动示例/ }).waitFor();
  await canvas.getByRole("button", { name: "源代码" }).click();
  const a2ui = {
    a2ui_operations: [
      { version: "v0.9", createSurface: { surfaceId: "A2UI教学", catalogId: "jzx-teaching" } },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "A2UI教学",
          components: [
            { id: "root", component: "Column", children: ["md", "formula"] },
            { id: "md", component: "Markdown", text: { path: "/lesson" } },
            { id: "formula", component: "Formula", latex: "Nu=\\frac{hL}{\\lambda}" },
          ],
        },
      },
      {
        version: "v0.9",
        updateDataModel: {
          surfaceId: "A2UI教学",
          path: "/",
          value: { lesson: "# 冶金传输原理\n\n对流热流密度：$q=h\\Delta T$。" },
        },
      },
    ],
  };
  await canvas
    .getByRole("textbox", { name: "画布源代码" })
    .fill("```a2ui\n" + JSON.stringify(a2ui) + "\n```");
  await canvas.getByRole("button", { name: "更新画布" }).click();
  await canvas.getByRole("heading", { name: "冶金传输原理", exact: true }).waitFor();
  await canvas.locator(".katex").nth(1).waitFor();
  await canvas.getByRole("button", { name: "源代码" }).click();
  const patch = {
    a2ui_operations: [
      {
        version: "v0.9",
        updateDataModel: {
          surfaceId: "A2UI教学",
          path: "/lesson",
          value: "# 凝固传热：更新已生效",
        },
      },
    ],
  };
  await canvas
    .getByRole("textbox", { name: "画布源代码" })
    .fill("```a2ui\n" + JSON.stringify(patch) + "\n```");
  await canvas.getByRole("button", { name: "更新画布" }).click();
  await canvas.getByRole("heading", { name: "凝固传热：更新已生效" }).waitFor();
  await canvas.locator(".katex").waitFor();
  console.log(
    "PASS: Markdown, KaTeX inline/block formula, official A2UI messages and data binding updates",
  );
  await page.getByRole("button", { name: "返回编辑器" }).click();
  await page.getByRole("button", { name: "课件 PPT", exact: true }).click();
  await page.getByRole("button", { name: "查看互动示例（非模型生成）" }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
  );
  assert.deepEqual(errors, []);
  await mkdir("output/playwright", { recursive: true });
  await page.screenshot({ path: "output/playwright/teaching-canvas-mobile.png" });
  console.log(
    "PASS: Mermaid, HTML isolation/action, field action, fixture reply import, undo/reload, panel isolation and mobile",
  );
} finally {
  await browser.close();
}
