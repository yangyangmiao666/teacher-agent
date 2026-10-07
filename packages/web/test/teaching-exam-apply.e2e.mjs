/** 无模型/凭据的浏览器回归；自启隔离 Vite，覆盖真实自动应用 effect。 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const require = createRequire(new URL("../../desktop/package.json", import.meta.url));
const { chromium } = require("playwright-core");
const root = fileURLToPath(new URL("..", import.meta.url));
const server = await createServer({
  root,
  configFile: `${root}/vite.config.ts`,
  server: { host: "127.0.0.1", port: 0, open: false },
});
const route = "/test/fixtures/teaching-exam-apply.html";
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  browser = await chromium.launch({ headless: true });
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ locale: "zh-CN", viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}${route}`);
    const title = page.getByRole("textbox", { name: "试卷标题", exact: true });
    await title.waitFor();
    const question = {
      id: 12,
      type: "calc",
      knowledgeId: "K02",
      knowledgeLabel: "传热",
      difficulty: "medium",
      stem: "浏览器回归：计算努塞尔数。",
      answer: "Nu=10",
      score: 10,
    };
    const fence = (data) => "```jzx-exam\n" + JSON.stringify(data) + "\n```";
    await page.evaluate(
      (text) => window.examFixture.receive(text),
      fence({ title: "数字 ID 测验", questions: [question] }),
    );
    await page
      .getByTestId("teaching-apply-dock")
      .getByText("已写入 1 道题并加入试卷", { exact: true })
      .waitFor();
    assert.equal(await title.inputValue(), "数字 ID 测验");
    const after = await page.evaluate(() => window.examFixture.snapshot());
    assert.equal(after.questions.find((item) => item.id === "12")?.answer, "Nu=10");
    assert.ok(after.paper.questionIds.includes("12"));
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await page.waitForFunction(
      () => JSON.stringify(window.examFixture.snapshot()) === window.examFixture.before,
    );
    // 非完成态不自动写入；仍可手动应用，沿用同一解析与撤销路径。
    await page.evaluate(
      (text) => window.examFixture.receive(text, false),
      fence({ title: "手动测验", questions: [{ ...question, id: 13 }] }),
    );
    const apply = page.getByRole("button", { name: "应用到左侧", exact: true });
    await apply.waitFor();
    assert.equal(
      await page.evaluate(
        () => JSON.stringify(window.examFixture.snapshot()) === window.examFixture.before,
      ),
      true,
    );
    await apply.click();
    await page.getByText("已写入 1 道题并加入试卷", { exact: true }).waitFor();
    assert.equal(await title.inputValue(), "手动测验");
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await page.waitForFunction(
      () => JSON.stringify(window.examFixture.snapshot()) === window.examFixture.before,
    );
    await page.evaluate(
      (text) => window.examFixture.receive(text),
      "# 试卷：拒绝部分应用\n## 教学目标\n保持编辑器可用\n" +
        fence({ questions: [question, { ...question, id: {} }] }),
    );
    await apply.waitFor({ state: "hidden" });
    assert.equal(
      await page.evaluate(
        () => JSON.stringify(window.examFixture.snapshot()) === window.examFixture.before,
      ),
      true,
    );
    await title.fill("非法回复后仍可编辑");
    assert.equal(
      (await page.evaluate(() => window.examFixture.snapshot())).paper.title,
      "非法回复后仍可编辑",
    );
    assert.equal(await page.getByText("这块界面出了点问题", { exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `PASS: ${width}px numeric ID auto/manual apply, undo, invalid JSON rejection and editor usability`,
    );
  }
} finally {
  await browser?.close();
  await server.close();
}
