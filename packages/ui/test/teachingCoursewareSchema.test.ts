import assert from "node:assert/strict";
import { test } from "node:test";
import { teachingCoursewarePatchSchema } from "../src/teaching/teachingCoursewareSchema.js";

test("完整课件协议只接纳内容字段并保留独立讲稿", () => {
  const value = teachingCoursewarePatchSchema.parse({
    id: "untrusted",
    updatedAt: -1,
    title: "完整课件",
    slides: [{ title: "案例", body: "真实正文", notes: "教师讲稿" }],
  });
  assert.equal("id" in value, false);
  assert.equal("updatedAt" in value, false);
  assert.equal(value.slides?.[0]?.notes, "教师讲稿");
});
test("类型、空正文、超限及空对象失败，不部分应用", () => {
  for (const value of [
    {},
    { title: 12 },
    { slides: [{ title: "无正文", body: "" }] },
    { slides: Array.from({ length: 81 }, () => ({ title: "页", body: "内容" })) },
  ]) {
    assert.equal(teachingCoursewarePatchSchema.safeParse(value).success, false);
  }
});

import { parseTeachingApplyCandidate } from "../src/teaching/teachingApplyParse.js";
test("完成回复通过现有解析入口获得高置信 slides，非法回复不降级应用", () => {
  const reply =
    "```jzx-courseware\n" +
    JSON.stringify({
      title: "教学课件",
      slides: [{ title: "专业案例", body: "完整正文", notes: "讲授顺序" }],
    }) +
    "\n```";
  const candidate = parseTeachingApplyCandidate(reply, "courseware-editor");
  assert.equal(candidate?.confidence, 0.95);
  assert.equal(candidate?.courseware?.slides?.[0]?.body, "完整正文");
  assert.equal(
    parseTeachingApplyCandidate(
      '## 目标\n可能误应用\n```jzx-courseware\n{"slides":[{"body":12}]}\n```',
      "courseware-editor",
    ),
    null,
  );
});

import { useTeachingWorkbenchStore } from "../src/store/teachingWorkbenchStore.js";
import {
  applyTeachingCandidate,
  restoreTeachingUndo,
} from "../src/teaching/teachingApplyActions.js";
test("完整课件回复走现有写入与撤销路径，保留条目身份", () => {
  const workspacePath = "/virtual/full-ppt-test";
  const store = useTeachingWorkbenchStore.getState();
  const before = structuredClone(store.ensureWorkspace(workspacePath));
  const candidate = parseTeachingApplyCandidate(
    '```jzx-courseware\n{"id":"malicious","title":"已生成完整课件","slides":[{"title":"案例","body":"专业正文","notes":"逐页讲稿"}]}\n```',
    "courseware-editor",
  );
  assert.ok(candidate);
  const applied = applyTeachingCandidate({ workspacePath, candidate });
  assert.ok(applied);
  const after = store.getWorkspace(workspacePath);
  const item = after.coursewares.find((page) => page.id === before.activeCoursewareId);
  assert.equal(item?.slides?.[0]?.notes, "逐页讲稿");
  assert.equal(item?.id, before.activeCoursewareId);
  restoreTeachingUndo(applied.undo);
  assert.deepEqual(store.getWorkspace(workspacePath), before);
});
