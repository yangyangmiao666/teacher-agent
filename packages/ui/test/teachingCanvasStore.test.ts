import assert from "node:assert/strict";
import { test } from "node:test";
import { teachingCanvasKey, useTeachingCanvasStore } from "../src/store/teachingCanvasStore.js";

test("画布唯一草稿所有者：隔离、错误保护、撤销后历史不重放、刷新保留表单", () => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => storage.get(k) || null,
      setItem: (k: string, v: string) => storage.set(k, v),
    },
  });
  const store = useTeachingCanvasStore.getState();
  const key = teachingCanvasKey("/same", "remote-A", "lesson-editor");
  const other = teachingCanvasKey("/same", "remote-B", "lesson-editor");
  const reply =
    "```jzx-ui\n" +
    JSON.stringify({
      title: "教学",
      components: [{ id: "root", component: "TextField", label: "知识点" }],
    }) +
    "\n```";
  store.ensure(key);
  store.ensure(other);
  store.receive(key, "session:row1", reply);
  store.setValue(key, "root", "传热");
  assert.equal(useTeachingCanvasStore.getState().drafts[other]?.surface, null);
  store.receive(key, "session:row2", "```jzx-ui\n{}\n```");
  assert.equal(useTeachingCanvasStore.getState().drafts[key]?.surface?.title, "教学");
  assert.equal(useTeachingCanvasStore.getState().drafts[key]?.error, true);
  useTeachingCanvasStore.setState({ drafts: {} });
  store.ensure(key);
  assert.equal(useTeachingCanvasStore.getState().drafts[key]?.values.root, "传热");
  store.undo(key);
  assert.equal(useTeachingCanvasStore.getState().drafts[key]?.surface, null);
  store.receive(key, "session:row1", reply);
  assert.equal(useTeachingCanvasStore.getState().drafts[key]?.surface, null);
  delete (globalThis as { localStorage?: unknown }).localStorage;
});
