/** 本地教学交互 E2E；先启动 :3030 并生成 deploy/access-output。凭据不输出。 */
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../desktop/package.json", import.meta.url));
const { chromium } = require("playwright-core");
const credential = (await readFile("deploy/access-output/token.txt", "utf8")).trim();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.JZX_TEST_BROWSER_CHANNEL
    ? { channel: process.env.JZX_TEST_BROWSER_CHANNEL }
    : {}),
});
const page = await browser.newPage({ locale: "zh-CN", viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
try {
  await page.goto(process.env.JZX_TEST_BASE_URL || "http://127.0.0.1:3030/");
  await page.getByTestId("test-access-login").waitFor();
  await page.getByTestId("test-access-password").fill("invalid-credential");
  await page.getByRole("button", { name: "进入教学工作台" }).click();
  await page.getByRole("alert").waitFor();
  await page.getByTestId("test-access-password").fill(credential);
  await page.getByRole("button", { name: "进入教学工作台" }).click();
  await page.getByTestId("teaching-workbench").waitFor({ timeout: 20000 });
  assert.equal(page.url().includes("token="), false);
  const workbench = page.getByTestId("teaching-workbench");
  // 当前环境允许已配置模型；订阅入口在两种配置下都应隐藏。
  assert.equal(await workbench.getByRole("button", { name: "升级", exact: true }).count(), 0);
  await page.getByTestId("teaching-canvas-toggle").click();
  const title = workbench.locator('[data-teaching-field="title"] input');
  const original = await title.inputValue();
  await title.fill("E2E 虚构课程标题");
  await page.reload();
  await page.getByTestId("teaching-workbench").waitFor();
  await page.getByTestId("teaching-canvas-toggle").click();
  assert.equal(await title.inputValue(), "E2E 虚构课程标题");
  await title.fill(original);
  for (const [stage, panels] of [
    ["课前准备", ["教案编辑器", "课件 PPT", "案例库"]],
    ["课后评价", ["题库组卷", "作业评阅台", "学情看板"]],
    ["实践教学", ["实训材料"]],
  ]) {
    await workbench
      .locator("aside")
      .getByRole("button", { name: new RegExp(`^${stage}`) })
      .click();
    for (const panel of panels) {
      await workbench.getByRole("button", { name: panel, exact: true }).click();
      await workbench.getByRole("heading", { name: panel, exact: true }).waitFor();
    }
  }
  await workbench
    .locator("aside")
    .getByRole("button", { name: /^课后评价/ })
    .click();
  await workbench.getByRole("button", { name: "题库组卷", exact: true }).click();
  await workbench.getByRole("button", { name: "问智能体", exact: true }).click();
  const composer = workbench.locator('[contenteditable="true"]').last();
  await composer.getByText(/100分测验卷/).waitFor();
  const askDraft = await composer.innerText();
  assert.ok(askDraft.includes("材料加工冶金与传输原理"));
  assert.ok(askDraft.length < 300);
  for (const internal of [
    "$exam-paper",
    "当前左侧内容",
    "jzx-ui",
    "components",
    "q = h",
    "JSON",
    "知识点清单",
  ])
    assert.equal(askDraft.includes(internal), false);
  await workbench.getByRole("button", { name: "推荐开场", exact: true }).click();
  await composer.getByText(/100 分测验/).waitFor();
  assert.equal((await composer.innerText()).includes("jzx-ui"), false);
  console.log("PASS: teacher-only exam/starter prefill excludes internal context and UI protocol");
  await workbench
    .locator("aside")
    .getByRole("button", { name: /^课前准备/ })
    .click();
  await workbench.getByRole("button", { name: "课件 PPT", exact: true }).click();
  await page.getByTestId("teaching-canvas-toggle").click();
  await workbench.getByRole("button", { name: "推荐开场", exact: true }).click();
  await composer.getByText(/制作约 18 页完整教学 PPT/).waitFor();
  const pptStarter = await composer.innerText();
  assert.ok(pptStarter.includes(".pptx"));
  assert.ok(pptStarter.includes("逐页讲稿"));
  assert.ok(pptStarter.includes("左侧预览"));
  assert.equal(pptStarter.includes("课件提纲"), false);
  assert.equal(pptStarter.includes("jzx-courseware"), false);
  await page.getByTestId("courseware-generate").click();
  await composer.getByText(/制作完整课件PPT/).waitFor();
  assert.equal((await composer.innerText()).includes("jzx-courseware"), false);
  const count = await page.getByTestId("courseware-page").count();
  await page.getByTestId("courseware-add-page").click();
  const added = page.getByTestId("courseware-page").nth(count);
  if (!(await added.locator("details[open]").count())) await added.locator("summary").click();
  await added
    .getByRole("textbox", { name: `标题 ${count + 1}`, exact: true })
    .fill("E2E 完整课件案例");
  await added
    .getByRole("textbox", { name: `幻灯片正文 ${count + 1}`, exact: true })
    .fill("冶金案例完整正文，课堂解答 Nu=10。\n\n$Nu=10$");
  await added
    .getByRole("textbox", { name: `本页讲稿 ${count + 1}`, exact: true })
    .fill("E2E 独立讲稿：请学生核验单位。");
  await added.locator(".katex").waitFor();
  await page.reload();
  await page.getByTestId("teaching-workbench").waitFor();
  await workbench.getByRole("button", { name: "课件 PPT", exact: true }).click();
  await page.getByTestId("teaching-canvas-toggle").click();
  const restored = page.getByTestId("courseware-page").nth(count);
  await restored.locator("summary").click();
  assert.ok(
    (
      await restored
        .getByRole("textbox", { name: `幻灯片正文 ${count + 1}`, exact: true })
        .inputValue()
    ).includes("冶金案例完整正文"),
  );
  const downloading = page.waitForEvent("download");
  await page.getByTestId("teaching-courseware-pptx").click();
  const deck = await downloading;
  assert.ok(deck.suggestedFilename().endsWith(".pptx"));
  await deck.saveAs("output/playwright/teaching-courseware.pptx");
  const bytes = await readFile("output/playwright/teaching-courseware.pptx");
  assert.equal(bytes.subarray(0, 2).toString(), "PK");
  console.log("PASS: browser downloads editable PowerPoint draft");
  await workbench
    .locator("aside")
    .getByRole("button", { name: /^课前准备/ })
    .click();
  await mkdir("output/playwright", { recursive: true });
  await workbench.screenshot({
    path: "output/playwright/teaching-workbench-desktop.png",
  });
  console.log(
    "PASS: login, invalid credential rejection, seven panels, draft persistence, no subscription entry",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    () =>
      document.querySelector("[data-workspace-sidebar-panel]")?.getBoundingClientRect().width === 0,
  );
  await workbench.getByRole("button", { name: "课后评价", exact: true }).click();
  await workbench.getByRole("button", { name: "学情看板", exact: true }).click();
  await workbench.getByRole("heading", { name: "学情看板", exact: true }).waitFor();
  const mobileTools = await workbench.locator(".jzx-tool-column").boundingBox();
  assert.ok(mobileTools && mobileTools.width >= 340 && mobileTools.height >= 400);
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  assert.equal(fits, true, "Mobile page must not overflow horizontally");
  await workbench.locator(".jzx-panel-split").evaluate((element) => {
    element.scrollTop = 0;
  });
  await workbench.screenshot({
    path: "output/playwright/teaching-workbench-mobile.png",
  });
  console.log("PASS: mobile stage/panel navigation");
  assert.deepEqual(pageErrors, []);
} finally {
  await browser.close();
}
