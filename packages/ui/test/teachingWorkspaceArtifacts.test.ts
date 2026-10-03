import assert from "node:assert/strict";
import { test } from "node:test";
import { replaceRemoteWorkspaceIdentityPath, parseRemoteWorkspaceIdentity } from "@zcode/shared";
import {
  teachingPanelBindingKey,
  useTeachingPanelChatStore,
} from "../src/store/teachingPanelChatStore.js";
import {
  resolveTeachingArtifactPath,
  parseTeachingArtifacts,
} from "../src/teaching/teachingArtifacts.js";
import { parseTeachingSurface } from "../src/teaching/teachingCanvasProtocol.js";
import { teachingCanvasKey, useTeachingCanvasStore } from "../src/store/teachingCanvasStore.js";

test("页面目录绑定按父身份与panel隔离，选中目录的会话独立恢复", () => {
  const a = { workspacePath: "/root", workspaceIdentity: "host-a" };
  const b = { workspacePath: "/root", workspaceIdentity: "host-b" };
  const store = useTeachingPanelChatStore.getState();
  store.setPanelWorkspace(a, "lesson-editor", { workspacePath: "/course-a" });
  store.setPanelWorkspace(a, "courseware-editor", { workspacePath: "/course-b" });
  const bindings = useTeachingPanelChatStore.getState().workspaceBindings;
  assert.equal(bindings[teachingPanelBindingKey(a, "lesson-editor")]?.workspacePath, "/course-a");
  assert.equal(
    bindings[teachingPanelBindingKey(a, "courseware-editor")]?.workspacePath,
    "/course-b",
  );
  assert.equal(bindings[teachingPanelBindingKey(b, "lesson-editor")], undefined);
  store.setPanelSession("/course-a", undefined, "lesson-editor", "session-a");
  store.setPanelSession("/course-b", undefined, "lesson-editor", "session-b");
  assert.equal(store.getPanelSession("/course-a", undefined, "lesson-editor"), "session-a");
});
test("远程目录替换保持SSH/WSL用户/Docker authority", () => {
  for (const identity of [
    "remote:ssh:host:22:teacher:/old",
    "remote:wsl:Ubuntu:root:/old",
    "remote:docker:course:/old",
  ]) {
    const result = replaceRemoteWorkspaceIdentityPath(identity, "/next/course");
    assert.equal(result, identity.replace("/old", "/next/course"));
    assert.equal(parseRemoteWorkspaceIdentity(result)?.workspacePath, "/next/course");
  }
  assert.throws(() => replaceRemoteWorkspaceIdentityPath("not-remote", "/next"));
});
test("产物限定当前工作区，拒绝URL/穿越/相似目录前缀", () => {
  assert.equal(
    resolveTeachingArtifactPath("/course", "outputs/课件.pptx"),
    "/course/outputs/课件.pptx",
  );
  assert.equal(
    resolveTeachingArtifactPath("C:\\Course", "outputs\\slides.pptx"),
    "C:/Course/outputs/slides.pptx",
  );
  for (const path of [
    "../slides.pptx",
    "/course-other/slides.pptx",
    "https://example.com/slides.pptx",
    "file:///course/slides.pptx",
    "outputs/a.txt",
  ])
    assert.equal(resolveTeachingArtifactPath("/course", path), null);
  const refs = parseTeachingArtifacts(
    '```jzx-artifacts\n{"artifacts":[{"path":"outputs/course.pptx"},{"path":"../secret.pdf"}]}\n```',
    "/course",
  );
  assert.equal(refs.length, 1);
});
test("完整教学JSON投影为正文，混合图表回复保留全部教学文本", () => {
  const reply =
    '```jzx-courseware\n{"title":"对流传热","slides":[{"title":"公式与解答","body":"Nu=10","notes":"核验单位"}]}\n```';
  const surface = parseTeachingSurface(reply)!;
  assert.ok(String(surface.components[0]?.text).includes("Nu=10"));
  assert.ok(String(surface.components[0]?.text).includes("核验单位"));
  assert.equal(String(surface.components[0]?.text).includes('"slides"'), false);
  const mixed = parseTeachingSurface(reply + "\n\n课堂讨论\n```mermaid\nflowchart LR\nA-->B\n```")!;
  assert.ok(
    mixed.components.some((c) => c.component === "Markdown" && String(c.text).includes("课堂讨论")),
  );
  assert.ok(mixed.components.some((c) => c.component === "Mermaid"));
});
test("A2UI与完整教学正文同时展示，产物与目录/页面隔离，撤销恢复正文", () => {
  const store = useTeachingCanvasStore.getState();
  const key = teachingCanvasKey("/course", undefined, "courseware-editor");
  const ui =
    '```jzx-ui\n{"title":"互动","components":[{"id":"root","component":"Text","text":"请讨论"}]}\n```';
  store.receive(
    key,
    "one",
    ui + '\n```jzx-courseware\n{"slides":[{"title":"题目","body":"完整正文"}]}\n```',
  );
  assert.ok(useTeachingCanvasStore.getState().drafts[key]?.document.includes("完整正文"));
  store.addArtifacts(
    key,
    [{ id: "fixture", name: "课件.pptx", source: "local", createdAt: 0 }],
    true,
  );
  assert.equal(useTeachingCanvasStore.getState().drafts[key]?.selectedArtifactId, "fixture");
  assert.equal(
    useTeachingCanvasStore.getState().drafts[
      teachingCanvasKey("/other", undefined, "courseware-editor")
    ],
    undefined,
  );
  store.receive(
    key,
    "two",
    ui + '\n```jzx-courseware\n{"slides":[{"title":"题目","body":"新正文"}]}\n```',
  );
  store.undo(key);
  assert.ok(useTeachingCanvasStore.getState().drafts[key]?.document.includes("完整正文"));
  store.receive(key, "three", ui + "\n\n### 教学解答\nMarkdown 正文与 $Nu=10$ 同时保留");
  assert.ok(useTeachingCanvasStore.getState().drafts[key]?.document.includes("Markdown 正文"));
});
