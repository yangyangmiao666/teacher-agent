import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildTeachingContextAppendix,
  wrapPromptWithTeachingContext,
} from "../src/teaching/teachingContext.js";
import { createSeedTeachingData } from "../src/teaching/teachingSeed.js";

test("组卷按完整冶金传输知识点范围，不把局部已选题当作课程大纲", () => {
  const data = createSeedTeachingData();
  const context = buildTeachingContextAppendix("exam-builder", data, "zh-CN");
  for (const item of data.knowledgeStats)
    assert.ok(context.includes(`${item.knowledgeId} ${item.label}`));
  assert.ok(context.includes("铸造凝固"));
  assert.ok(context.includes("加热炉热平衡"));
  assert.ok(context.includes("冶金反应器"));
  assert.ok(context.includes("不代表全课程"));
  assert.equal(context.includes("OBE"), false);
  assert.ok(context.includes("jzx-exam"));
});
test("上下文关闭只返回教师请求；教案特有要求不污染其他子台", () => {
  const data = createSeedTeachingData();
  const request = "请组一份100分测验卷。";
  assert.equal(
    wrapPromptWithTeachingContext(
      request,
      buildTeachingContextAppendix("exam-builder", data, "zh-CN"),
      false,
    ),
    request,
  );
  assert.ok(buildTeachingContextAppendix("lesson-editor", data, "zh-CN").includes("OBE"));
  assert.ok(buildTeachingContextAppendix("exam-builder", data, "en-US").includes("solidification"));
});
