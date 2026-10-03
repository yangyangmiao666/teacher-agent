/** 已知教学回复与真实PPT文件的交互验证，不冒充模型生成质量测试。 */
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../desktop/package.json", import.meta.url));
const { chromium } = require("playwright-core");
const a = resolve(".tmp/teaching-page-a"),
  b = resolve(".tmp/teaching-page-b");
await mkdir(`${a}/outputs/office`, { recursive: true });
await mkdir(b, { recursive: true });
const uiRequire = createRequire(new URL("../../ui/package.json", import.meta.url));
const PptxGenJS = uiRequire("pptxgenjs");
const fixture = new PptxGenJS();
fixture.addSlide().addText("真实教学文件预览夹具", { x: 1, y: 1, w: 8, h: 1 });
await fixture.writeFile({ fileName: `${a}/outputs/office/真实教学产物.pptx` });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ locale: "zh-CN", viewport: { width: 1600, height: 1100 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto("http://localhost:5173");
  await page
    .getByTestId("test-access-password")
    .fill((await readFile("deploy/access-output/token.txt", "utf8")).trim());
  await page.getByRole("button", { name: "进入教学工作台" }).click();
  const workbench = page.getByTestId("teaching-workbench");
  await workbench.waitFor();
  await page.getByTestId("teaching-interaction-trail").waitFor();
  const initial = await page.getByTestId("teaching-workspace-picker").innerText();
  const choose = async (path) => {
    await page.getByTestId("teaching-workspace-picker").click();
    const dialog = page.getByRole("dialog", { name: "选择本页工作区" });
    await dialog.getByRole("textbox").fill(path);
    await dialog.getByRole("button", { name: "前往", exact: true }).click();
    await dialog.getByRole("button", { name: "选择此目录", exact: true }).click();
    await page.getByTestId("teaching-workspace-picker").getByText(path, { exact: true }).waitFor();
  };
  await choose(a);
  const canvas = page.getByTestId("teaching-canvas");
  await canvas.getByRole("button", { name: "查看互动示例（非模型生成）" }).click();
  const receive = async (reply) => {
    await canvas.getByRole("button", { name: "源代码", exact: true }).click();
    await canvas.getByRole("textbox", { name: "画布源代码" }).fill(reply);
    await canvas.getByRole("button", { name: "更新画布" }).click();
  };
  await receive(
    '```jzx-courseware\n{"title":"目录A完整教学文档","slides":[{"title":"公式教学","body":"Nu=10，课堂答案与完整解释。","notes":"请教师核验单位"}]}\n```',
  );
  await canvas.getByText(/课堂答案与完整解释/).waitFor();
  assert.equal((await canvas.innerText()).includes('"slides"'), false);
  await choose(b);
  assert.equal(await canvas.getByText(/课堂答案与完整解释/).count(), 0);
  await workbench.getByRole("button", { name: "课件 PPT", exact: true }).click();
  assert.equal(await page.getByTestId("teaching-workspace-picker").innerText(), initial);
  await choose(a);
  await page.getByTestId("teaching-canvas-toggle").click();
  const downloaded = page.waitForEvent("download");
  await page.getByTestId("teaching-courseware-pptx").click();
  const deck = await downloaded;
  await deck.saveAs("output/playwright/canvas-preview-courseware.pptx");
  const preview = page.getByTestId("teaching-artifact-preview");
  await preview.waitFor();
  await preview
    .getByRole("textbox", { name: "幻灯片页码", exact: true })
    .waitFor({ timeout: 30000 });
  assert.equal(
    await preview.getByRole("textbox", { name: "幻灯片页码", exact: true }).inputValue(),
    "1",
  );
  await preview.getByRole("button", { name: "下一张幻灯片", exact: true }).click();
  assert.equal(
    await preview.getByRole("textbox", { name: "幻灯片页码", exact: true }).inputValue(),
    "2",
  );
  await preview.screenshot({ path: "output/playwright/teaching-ppt-preview.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
  );
  await page.setViewportSize({ width: 1600, height: 1100 });
  console.log("PASS: generated PPT appears on left with actual slide navigation");
  await page.reload();
  await workbench.waitFor();
  await workbench.getByRole("button", { name: "课件 PPT", exact: true }).click();
  await preview
    .getByRole("textbox", { name: "幻灯片页码", exact: true })
    .waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "关闭产物预览" }).click();
  await page.getByRole("button", { name: "刷新产物", exact: true }).click();
  await page.getByTestId("teaching-artifact-tile").filter({ hasText: "真实教学产物.pptx" }).click();
  await preview
    .getByRole("textbox", { name: "幻灯片页码", exact: true })
    .waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "关闭产物预览" }).click();
  await workbench.getByRole("button", { name: "教案编辑器", exact: true }).click();
  assert.ok((await page.getByTestId("teaching-workspace-picker").innerText()).includes(b));
  await choose(a);
  await canvas.getByText(/课堂答案与完整解释/).waitFor();
  await receive(
    '```jzx-ui\n{"title":"教学联动画布","components":[{"id":"root","component":"Card","children":["title","input","action"]},{"id":"title","component":"Markdown","text":"### 专业案例互动\\n$Nu=10$"},{"id":"input","component":"TextField","label":"讨论知识点"},{"id":"action","component":"Button","label":"让智能体完善案例","prompt":"根据填写知识点完善专业案例"}]}\n```',
  );
  await canvas.getByRole("textbox", { name: "讨论知识点" }).fill("加热炉传热");
  await canvas.getByRole("button", { name: "让智能体完善案例" }).click();
  const composer = workbench.locator('[contenteditable="true"]').last();
  await composer.getByText(/根据填写知识点完善专业案例/).waitFor();
  assert.ok((await composer.innerText()).includes("加热炉传热"));
  await mkdir("output/playwright", { recursive: true });
  await workbench.screenshot({ path: "output/playwright/teaching-workspace-interaction.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: workspace/page isolation, reload, cached/server PPT previews, A2UI return action, mobile layout",
  );
} finally {
  await browser.close();
}
