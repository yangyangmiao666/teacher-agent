import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isTeachingChartOption,
  teachingChartRenderOption,
} from "../src/teaching/teachingChartOptions.js";
import { useTeachingCanvasStore } from "../src/store/teachingCanvasStore.js";

test("图表只接受有界JSON，不接受函数及超量序列", () => {
  assert.equal(
    isTeachingChartOption({
      series: [{ type: "bar", data: [1] }],
      tooltip: { formatter: () => "执行" },
    }),
    false,
  );
  assert.equal(
    isTeachingChartOption({ series: Array.from({ length: 21 }, () => ({ type: "bar" })) }),
    false,
  );
  assert.equal(isTeachingChartOption({ series: [{ type: "line", data: [Infinity] }] }), false);
  assert.equal(
    isTeachingChartOption({ series: [{ type: "pie", data: [{ name: "模拟", value: 70 }] }] }),
    true,
  );
});
test("所有tooltip以richText渲染并遵循减少动画偏好，原始业务option不变", () => {
  const option = {
    tooltip: { renderMode: "html", trigger: "axis" },
    series: [{ type: "bar", tooltip: { renderMode: "html" }, data: [1] }],
  };
  const result = teachingChartRenderOption(option, true);
  assert.equal((result.tooltip as Record<string, unknown>).renderMode, "richText");
  assert.equal(
    (result.series as { tooltip: { renderMode: string } }[])[0]!.tooltip.renderMode,
    "richText",
  );
  assert.equal(result.animation, false);
  assert.equal(option.tooltip.renderMode, "html");
});
test("无效图表回复不能破坏已有画布或表单", () => {
  const store = useTeachingCanvasStore.getState();
  const key = "chart-validation";
  store.receive(
    key,
    "valid",
    '```jzx-ui\n{"title":"原画布","components":[{"id":"root","component":"TextField","label":"知识点"}]}\n```',
  );
  store.setValue(key, "root", "Nu");
  store.receive(key, "invalid", '```echarts\n{"series":[{"type":"custom"}]}\n```');
  const draft = useTeachingCanvasStore.getState().drafts[key]!;
  assert.equal(draft.surface?.title, "原画布");
  assert.equal(draft.values.root, "Nu");
  assert.equal(draft.error, true);
});
