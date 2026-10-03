/** 无模型的已知教学回复夹具；验证真实 Markdown/公式/A2UI 渲染。 */
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
  await page.goto("http://localhost:5173");
  await page
    .getByTestId("test-access-password")
    .fill((await readFile("deploy/access-output/token.txt", "utf8")).trim());
  await page.getByRole("button", { name: "进入教学工作台" }).click();
  await page.getByTestId("teaching-workbench").waitFor();
  await page.getByRole("button", { name: "查看互动示例（非模型生成）" }).click();
  const canvas = page.getByTestId("teaching-canvas");
  await canvas.locator(".katex").nth(1).waitFor();
  await canvas.getByRole("columnheader", { name: "符号" }).waitFor();
  const receive = async (reply) => {
    await canvas.getByRole("button", { name: "源代码" }).click();
    await canvas.getByRole("textbox", { name: "画布源代码" }).fill(reply);
    await canvas.getByRole("button", { name: "更新画布" }).click();
  };
  await receive(
    "# 冶金传输原理\n\n行内：$q=h\\Delta T$。\n\n\\[Nu=\\frac{hL}{\\lambda}\\]\n\n| 符号 | 含义 |\n| --- | --- |\n| Nu | 努塞尔数 |",
  );
  await canvas.getByRole("heading", { name: "冶金传输原理", exact: true }).waitFor();
  await canvas.locator(".katex").nth(1).waitFor();
  await canvas.getByRole("cell", { name: "努塞尔数", exact: true }).waitFor();
  const initial = {
    a2ui_operations: [
      {
        version: "v0.9",
        createSurface: { surfaceId: "原生 A2UI 教学", catalogId: "jzx-teaching" },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "原生 A2UI 教学",
          components: [
            { id: "root", component: "Column", children: ["text", "math"] },
            { id: "text", component: "Markdown", text: { path: "/topic" } },
            { id: "math", component: "Formula", latex: "Nu=\\frac{hL}{\\lambda}" },
          ],
        },
      },
      {
        version: "v0.9",
        updateDataModel: {
          surfaceId: "原生 A2UI 教学",
          path: "/",
          value: { topic: "# 加热炉热平衡" },
        },
      },
    ],
  };
  await receive("```a2ui\n" + JSON.stringify(initial) + "\n```");
  await canvas.getByRole("heading", { name: "加热炉热平衡", exact: true }).waitFor();
  await canvas.locator(".katex").waitFor();
  await receive(
    "```a2ui\n" +
      JSON.stringify({
        a2ui_operations: [
          {
            version: "v0.9",
            updateComponents: {
              surfaceId: "原生 A2UI 教学",
              components: [
                { id: "math", component: "Formula", latex: "q=h\\Delta T", displayMode: false },
              ],
            },
          },
          {
            version: "v0.9",
            updateDataModel: { surfaceId: "原生 A2UI 教学", path: "/topic", value: "# 凝固传热" },
          },
        ],
      }) +
      "\n```",
  );
  await canvas.getByRole("heading", { name: "凝固传热", exact: true }).waitFor();
  await canvas.locator(".katex").waitFor();
  await page.reload();
  await canvas.getByRole("heading", { name: "凝固传热", exact: true }).waitFor();
  await canvas.locator(".katex").waitFor();
  await mkdir("output/playwright", { recursive: true });
  await canvas.screenshot({ path: "output/playwright/teaching-rich-canvas.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: plain Markdown, tables, inline/block KaTeX, official A2UI component/data updates, persistence and mobile",
  );
} finally {
  await browser.close();
}
