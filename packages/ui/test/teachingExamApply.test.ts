import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTeachingApplyCandidate } from "../src/teaching/teachingApplyParse.js";
import {
  applyTeachingCandidate,
  restoreTeachingUndo,
} from "../src/teaching/teachingApplyActions.js";
import { useTeachingWorkbenchStore } from "../src/store/teachingWorkbenchStore.js";

const question = {
  id: 12,
  type: "calc",
  knowledgeId: "heat",
  knowledgeLabel: "传热",
  difficulty: "medium",
  stem: "计算努塞尔数。",
  answer: "Nu=10",
  score: 10,
};
function reply(data: unknown, kind = "exam") {
  return `\`\`\`jzx-${kind}\n${JSON.stringify(data)}\n\`\`\``;
}

test("组卷数字 ID 在解析边界变为字符串，旧 code 题型仍可应用并撤销", () => {
  const workspacePath = "/virtual/exam-numeric-id";
  const workspaceIdentity = "exam-identity";
  const store = useTeachingWorkbenchStore.getState();
  const before = structuredClone(store.ensureWorkspace(workspacePath, workspaceIdentity));
  const candidate = parseTeachingApplyCandidate(
    reply({ title: "传输测验", questions: [{ ...question, type: "code" }] }, "exam-paper"),
    "exam-builder",
  );
  assert.ok(candidate);
  assert.equal(candidate.questions?.[0]?.id, "12");
  assert.equal(candidate.questions?.[0]?.type, "calc");
  const applied = applyTeachingCandidate({ workspacePath, workspaceIdentity, candidate });
  assert.ok(applied);
  const after = store.getWorkspace(workspacePath, workspaceIdentity);
  assert.equal(after.questions.find((item) => item.id === "12")?.answer, "Nu=10");
  assert.ok(after.paper.questionIds.includes("12"));
  assert.equal(after.paper.title, "传输测验");
  assert.equal(
    store.getWorkspace(workspacePath).questions.some((item) => item.id === "12"),
    false,
  );
  restoreTeachingUndo(applied.undo);
  assert.deepEqual(store.getWorkspace(workspacePath, workspaceIdentity), before);
});

test("字符串 ID 去空白；缺失、null 与空白 ID 沿用生成路径", () => {
  const candidate = parseTeachingApplyCandidate(
    reply({ questions: [" custom ", undefined, null, "  "].map((id) => ({ ...question, id })) }),
    "exam-builder",
  );
  assert.ok(candidate);
  assert.deepEqual(
    candidate.questions?.map((item) => item.id),
    ["custom", undefined, undefined, undefined],
  );
  const workspacePath = "/virtual/exam-generated-id";
  const before = useTeachingWorkbenchStore.getState().ensureWorkspace(workspacePath);
  const applied = applyTeachingCandidate({ workspacePath, candidate });
  assert.ok(applied);
  const data = useTeachingWorkbenchStore.getState().getWorkspace(workspacePath);
  const ids = data.paper.questionIds.filter((id) => !before.paper.questionIds.includes(id));
  assert.equal(new Set(ids).size, 4);
  for (const id of ids) assert.ok(data.questions.some((item) => item.id === id));
});

test("已有 Markdown 题块仍使用同一组卷应用路径", () => {
  const candidate = parseTeachingApplyCandidate(
    "# 试卷：传输测验\n### 1. 计算努塞尔数\n题型：计算\n知识点：传热\n难度：medium\n分值：10\n答案：Nu=10",
    "exam-builder",
  );
  assert.ok(candidate);
  assert.equal(candidate.source, "markdown-headings");
  assert.ok(applyTeachingCandidate({ workspacePath: "/virtual/exam-markdown", candidate }));
});

test("非法组卷整份拒绝，不能降级为 Markdown 或其它子台候选", () => {
  const invalid = [
    { questions: [] },
    { questions: [question, null] },
    { questions: [question, { ...question, id: {} }] },
    { questions: [{ ...question, id: true }] },
    { questions: [{ ...question, id: [] }] },
    { questions: [{ ...question, stem: 7 }] },
    { questions: [{ ...question, stem: " " }] },
    { questions: [{ ...question, answer: {} }] },
    { questions: [{ ...question, knowledgeId: 1 }] },
    { questions: [{ ...question, knowledgeLabel: [] }] },
    { questions: [{ ...question, difficulty: "unknown" }] },
    { questions: [{ ...question, type: "unknown" }] },
    { questions: [{ ...question, score: "10" }] },
    { questions: [{ ...question, score: -1 }] },
    { questions: [{ ...question, score: 0 }] },
    { title: {}, questions: [question] },
    { questions: [question, { ...question, id: " 12 " }] },
  ];
  const workspacePath = "/virtual/exam-invalid-json";
  const store = useTeachingWorkbenchStore.getState();
  const before = structuredClone(store.ensureWorkspace(workspacePath));
  for (const data of invalid) {
    for (const kind of ["exam", "exam-paper"]) {
      const text = `# 试卷：非法回复\n## 教学目标\n不能部分应用\n${reply(data, kind)}`;
      assert.equal(parseTeachingApplyCandidate(text, "exam-builder"), null);
      assert.equal(parseTeachingApplyCandidate(text), null);
    }
  }
  assert.deepEqual(store.getWorkspace(workspacePath), before);
});

test("直接应用非法候选也在首次写入前失败，合法前缀不能部分写入", () => {
  const workspacePath = "/virtual/exam-invalid-apply";
  const store = useTeachingWorkbenchStore.getState();
  const before = structuredClone(store.ensureWorkspace(workspacePath));
  const candidate = parseTeachingApplyCandidate(reply({ questions: [question] }), "exam-builder");
  assert.ok(candidate);
  for (const id of [false, {}, [], Infinity]) {
    const malformed = { ...candidate, questions: [question, { ...question, id }] };
    assert.equal(
      applyTeachingCandidate({
        workspacePath,
        candidate: malformed as unknown as typeof candidate,
      }),
      null,
    );
    assert.deepEqual(store.getWorkspace(workspacePath), before);
  }
});
