import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTeachingSurface } from "../src/teaching/teachingCanvasProtocol.js";
const fence = (value: unknown) => "```jzx-ui\n" + JSON.stringify(value) + "\n```";
test("完整 UI 与普通可视化围栏", () => {
  assert.equal(
    parseTeachingSurface(
      fence({ title: "教学", components: [{ id: "root", component: "Text", text: "目标" }] }),
    )?.title,
    "教学",
  );
  assert.equal(
    parseTeachingSurface("```mermaid\ngraph LR; A-->B\n```\n```html\n<h1>教学</h1>\n```")
      ?.components.length,
    3,
  );
  assert.equal(parseTeachingSurface("普通正文")?.components[0]?.component, "Markdown");
});
test("非法树和危险组件拒绝整体提交", () => {
  for (const components of [
    [{ id: "root", component: "Column", children: ["root"] }],
    [{ id: "root", component: "Column", children: ["missing"] }],
    [{ id: "root", component: "Script" }],
    [{ id: "root", component: "Markdown", text: { path: "/__proto__/bad" } }],
    [{ id: "root", component: "Button" }],
    [
      { id: "root", component: "Text" },
      { id: "root", component: "Text" },
    ],
  ])
    assert.throws(() => parseTeachingSurface(fence({ title: "教学", components })));
  assert.throws(() => parseTeachingSurface("x".repeat(100001) + "```html\nhello\n```"));
});
test("参考项目完整 A2UI 快照可接收，未创建 surface 的更新拒绝", () => {
  const value = {
    a2ui_operations: [
      { version: "v0.9", createSurface: { surfaceId: "teaching" } },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "teaching",
          components: [{ id: "root", component: "Text", text: "课程" }],
        },
      },
    ],
  };
  assert.equal(parseTeachingSurface(fence(value))?.title, "teaching");
  assert.throws(() =>
    parseTeachingSurface(
      fence({ a2ui_operations: [{ updateDataModel: { surfaceId: "teaching", value: {} } }] }),
    ),
  );
});

test("原生 A2UI 组件增量和数据绑定按同一 surface 提交", async () => {
  const { resolveTeachingText } = await import("../src/teaching/teachingA2ui.js");
  const initial = parseTeachingSurface(
    fence({
      a2ui_operations: [
        { version: "v0.9", createSurface: { surfaceId: "course", catalogId: "jzx-teaching" } },
        {
          version: "v0.9",
          updateComponents: {
            surfaceId: "course",
            components: [
              { id: "root", component: "Column", children: ["body", "eq"] },
              { id: "body", component: "Markdown", text: { path: "/topic" } },
              {
                id: "eq",
                component: "Formula",
                latex: "Nu=\\frac{hL}{\\lambda}",
                displayMode: true,
              },
            ],
          },
        },
        {
          version: "v0.9",
          updateDataModel: { surfaceId: "course", path: "/", value: { topic: "# 加热炉热平衡" } },
        },
      ],
    }),
  );
  assert.ok(initial);
  assert.equal(resolveTeachingText(initial.components[1]!, initial).text, "# 加热炉热平衡");
  const updated = parseTeachingSurface(
    fence({
      a2ui_operations: [
        {
          version: "v0.9",
          updateDataModel: { surfaceId: "course", path: "/topic", value: "# 凝固传热" },
        },
        {
          version: "v0.9",
          updateComponents: {
            surfaceId: "course",
            components: [{ id: "eq", component: "Formula", latex: "q=h\\Delta T" }],
          },
        },
      ],
    }),
    initial,
  );
  assert.ok(updated);
  assert.equal(updated.components.length, 3);
  assert.equal(resolveTeachingText(updated.components[1]!, updated).text, "# 凝固传热");
  assert.equal(initial.dataModel?.topic, "# 加热炉热平衡");
  assert.throws(() =>
    parseTeachingSurface(
      fence({
        a2ui_operations: [
          { version: "v0.9", updateDataModel: { surfaceId: "wrong", path: "/", value: {} } },
        ],
      }),
      initial,
    ),
  );
  assert.throws(() =>
    parseTeachingSurface(
      fence({
        a2ui_operations: [
          {
            version: "v0.9",
            updateDataModel: { surfaceId: "course", path: "/__proto__/polluted", value: true },
          },
        ],
      }),
      initial,
    ),
  );
});

test("Markdown 组件里的代码围栏不能截断外层 JSON 消息", () => {
  const markdown =
    "# 课程示例\n\n```python\nnu = h * length / conductivity\n```\n\n$Nu=hL/\\lambda$";
  const surface = parseTeachingSurface(
    fence({
      title: "公式与代码",
      components: [{ id: "root", component: "Markdown", text: markdown }],
    }),
  );
  assert.equal(surface?.components[0]?.text, markdown);
});

test("丰富教学组件与echarts围栏保留图表和教学正文", () => {
  const option = {
    xAxis: { data: ["Nu", "Re"] },
    yAxis: {},
    series: [{ type: "bar", data: [62, 85] }],
  };
  const surface = parseTeachingSurface(
    fence({
      title: "演示数据",
      components: [
        {
          id: "root",
          component: "Grid",
          columns: 2,
          children: ["stat", "chart", "select", "check", "progress", "heading", "badge", "divider"],
        },
        {
          id: "stat",
          component: "Stat",
          label: "知识点",
          value: "2",
          description: "演示",
          tone: "info",
        },
        { id: "chart", component: "ECharts", option, prompt: "分析这个知识点", height: 320 },
        { id: "select", component: "Select", label: "知识点", options: ["Nu", "Re"] },
        { id: "check", component: "Checkbox", label: "显示解答" },
        { id: "progress", component: "Progress", label: "掌握度", value: 62 },
        { id: "heading", component: "Heading", text: "教学诊断", level: 1 },
        { id: "badge", component: "Badge", label: "模拟数据", tone: "warning" },
        { id: "divider", component: "Divider" },
      ],
    }),
  );
  assert.equal(surface?.components[2]?.component, "ECharts");
  const standalone = parseTeachingSurface(
    "教学说明\n```echarts\n" +
      JSON.stringify(option) +
      "\n```\n```mermaid\nflowchart LR\nA-->B\n```",
  );
  assert.ok(standalone?.components.some((c) => c.component === "ECharts"));
  assert.ok(
    standalone?.components.some(
      (c) => c.component === "Markdown" && String(c.text).includes("教学说明"),
    ),
  );
});

test("图表非法选项与控件越界拒绝整体提交", () => {
  for (const node of [
    { component: "ECharts", option: { series: [{ type: "custom" }] } },
    {
      component: "ECharts",
      option: {
        series: [{ type: "bar", data: [1] }],
        graphic: { image: "https://example.com/a.svg" },
      },
    },
    { component: "ECharts", option: JSON.parse('{"series":[{"type":"bar"}],"__proto__":{}}') },
    { component: "Progress", value: 101 },
    { component: "Select", options: [] },
    { component: "Grid", columns: 5 },
  ])
    assert.throws(() =>
      parseTeachingSurface(fence({ title: "测试", components: [{ id: "root", ...node }] })),
    );
});
