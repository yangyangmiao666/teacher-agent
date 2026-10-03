/** 用明确的演示数据测试实际图表渲染，不模拟真实课堂成效。 */
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../desktop/package.json", import.meta.url));
const { chromium } = require("playwright-core");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ locale: "zh-CN", viewport: { width: 1600, height: 1100 } });
await page.emulateMedia({ reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://localhost:5173");
  await page
    .getByTestId("test-access-password")
    .fill((await readFile("deploy/access-output/token.txt", "utf8")).trim());
  await page.getByRole("button", { name: "进入教学工作台" }).click();
  const canvas = page.getByTestId("teaching-canvas");
  await canvas.getByRole("button", { name: "查看互动示例（非模型生成）" }).click();
  const chart = page.getByTestId("teaching-echarts");
  await chart.locator("svg").waitFor();
  await canvas.getByRole("heading", { name: "从知识诊断到课堂再设计" }).waitFor();
  await canvas.getByRole("combobox", { name: "教学侧重点" }).selectOption("专业工程案例");
  await canvas.getByRole("checkbox", { name: "附教师参考解答" }).check();
  await canvas.getByRole("textbox", { name: /需要重点讲解/ }).fill("对流边界层");
  // SVG高亮会改变柱形颜色；固定原柱形节点，避免hover后按颜色重新匹配tooltip标记。
  const bar = await chart.locator('path[fill="#efa758"]').first().elementHandle();
  assert.ok(bar);
  await bar.click();
  const composer = page.locator('[contenteditable="true"]').last();
  await composer.getByText(/努塞尔数 Nu/).waitFor();
  assert.ok((await composer.innerText()).includes("专业工程案例"));
  assert.ok((await composer.innerText()).includes("附教师参考解答: 是"));
  await page.reload();
  await chart.locator("svg").waitFor();
  assert.equal(
    await canvas.getByRole("combobox", { name: "教学侧重点" }).inputValue(),
    "专业工程案例",
  );
  assert.equal(await canvas.getByRole("checkbox", { name: "附教师参考解答" }).isChecked(), true);
  await mkdir("output/playwright", { recursive: true });
  await page
    .getByTestId("teaching-workbench")
    .locator(".jzx-tool-column .jzx-panel-frame > .overflow-y-auto")
    .evaluate((el) => {
      el.scrollTop = 0;
    });
  await page
    .getByTestId("teaching-workbench")
    .screenshot({ path: "output/playwright/teaching-visual-dashboard.png" });
  // 直接围栏和原生A2UI目录共用校验，确认真实多图型及增量更新。
  const source = async (text) => {
    await canvas.getByRole("button", { name: "源代码", exact: true }).click();
    await canvas.getByRole("textbox", { name: "画布源代码" }).fill(text);
    await canvas.getByRole("button", { name: "更新画布", exact: true }).click();
  };
  const options = [
    {
      title: { text: "趋势" },
      xAxis: { data: ["课前", "课后"] },
      yAxis: {},
      series: [{ type: "line", data: [42, 80] }],
    },
    {
      series: [
        {
          type: "pie",
          radius: ["40%", "65%"],
          data: [
            { name: "导热", value: 30 },
            { name: "对流", value: 70 },
          ],
        },
      ],
    },
    {
      radar: {
        indicator: [
          { name: "Nu", max: 100 },
          { name: "Re", max: 100 },
          { name: "Pr", max: 100 },
        ],
      },
      series: [{ type: "radar", data: [{ value: [50, 80, 70] }] }],
    },
    { series: [{ type: "gauge", data: [{ value: 65, name: "模拟掌握度" }] }] },
    {
      xAxis: { type: "category", data: ["Nu", "Re"] },
      yAxis: { type: "category", data: ["模拟A", "模拟B"] },
      visualMap: { min: 0, max: 100, show: false },
      series: [
        {
          type: "heatmap",
          data: [
            [0, 0, 52],
            [1, 0, 80],
            [0, 1, 60],
            [1, 1, 90],
          ],
        },
      ],
    },
  ];
  await source(
    "模拟数据：教学图表\n" +
      options.map((option) => "```echarts\n" + JSON.stringify(option) + "\n```").join("\n"),
  );
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="teaching-echarts"] svg').length === 5,
  );
  assert.equal(await canvas.getByRole("alert").count(), 0);
  await source(
    "```a2ui\n" +
      JSON.stringify({
        a2ui_operations: [
          { version: "v0.9", createSurface: { surfaceId: "rich", catalogId: "jzx-teaching" } },
          {
            version: "v0.9",
            updateComponents: {
              surfaceId: "rich",
              components: [
                { id: "root", component: "Grid", columns: 2, children: ["chart", "progress"] },
                { id: "chart", component: "ECharts", option: options[0] },
                { id: "progress", component: "Progress", label: "模拟掌握度", value: 42 },
              ],
            },
          },
        ],
      }) +
      "\n```",
  );
  await chart.locator("svg").waitFor();
  await canvas.getByRole("progressbar", { name: "模拟掌握度" }).waitFor();
  await source(
    "```a2ui\n" +
      JSON.stringify({
        a2ui_operations: [
          {
            version: "v0.9",
            updateComponents: {
              surfaceId: "rich",
              components: [
                { id: "chart", component: "ECharts", option: options[1] },
                { id: "progress", component: "Progress", label: "模拟掌握度", value: 80 },
              ],
            },
          },
        ],
      }) +
      "\n```",
  );
  await chart.locator("svg").waitFor();
  assert.equal(
    await canvas.getByRole("progressbar", { name: "模拟掌握度" }).getAttribute("value"),
    "80",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
  );
  assert.equal(
    await canvas
      .locator(".jzx-a2ui-grid")
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length),
    1,
  );
  await chart.locator("svg").waitFor();
  await page.waitForFunction(() => {
    const host = document.querySelector(`[data-testid="teaching-echarts"] [role="img"]`);
    const svg = host?.querySelector("svg");
    return svg && svg.getBoundingClientRect().width <= host.getBoundingClientRect().width + 1;
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: actual bar/line/pie/radar/gauge/heatmap SVGs, chart clicks, form persistence, native A2UI incremental updates, mobile/reduced motion",
  );
} finally {
  await browser.close();
}
