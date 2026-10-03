/** 明确标注的可视化演示夹具，不代表模型生成或真实学情。 */
export const TEACHING_CANVAS_DEMO =
  "```jzx-ui\n" +
  JSON.stringify({
    title: "传热教学互动示例 / Heat transfer example",
    components: [
      {
        id: "root",
        component: "Column",
        children: [
          "badge",
          "heading",
          "intro",
          "stats",
          "chart",
          "math",
          "diagram",
          "choices",
          "form",
          "ask",
          "html",
          "table",
        ],
      },
      { id: "badge", component: "Badge", label: "互动教学实验室 · 演示数据", tone: "info" },
      { id: "heading", component: "Heading", text: "从知识诊断到课堂再设计", level: 1 },
      {
        id: "stats",
        component: "Grid",
        columns: 3,
        children: ["stat-topic", "stat-risk", "stat-task"],
      },
      {
        id: "stat-topic",
        component: "Stat",
        label: "专业核心知识点",
        value: "3",
        description: "对流 · 边界层 · 无量纲数",
        tone: "info",
      },
      {
        id: "stat-risk",
        component: "Stat",
        label: "模拟薄弱点",
        value: "Nu",
        description: "演示数值，不代表真实学情",
        tone: "warning",
      },
      {
        id: "stat-task",
        component: "Stat",
        label: "课堂互动路径",
        value: "4 步",
        description: "诊断 → 解释 → 练习 → 反馈",
        tone: "success",
      },
      {
        id: "chart",
        component: "ECharts",
        label: "知识点诊断 · 模拟数据",
        description: "演示掌握度：点击任一柱形，生成该知识点的再教学建议。",
        height: 300,
        prompt: "根据这个知识点设计再教学活动，并更新左侧画布。",
        option: {
          color: ["#6c7bff", "#34c6bc", "#efa758"],
          tooltip: { trigger: "axis" },
          grid: { left: 45, right: 20, top: 25, bottom: 40 },
          xAxis: { type: "category", data: ["对流换热", "努塞尔数 Nu", "雷诺数 Re"] },
          yAxis: { type: "value", max: 100, name: "模拟掌握度 %" },
          series: [
            {
              name: "模拟掌握度",
              type: "bar",
              barWidth: "38%",
              itemStyle: { borderRadius: [8, 8, 0, 0] },
              data: [
                { value: 78, itemStyle: { color: "#6c7bff" } },
                { value: 52, itemStyle: { color: "#efa758" } },
                { value: 86, itemStyle: { color: "#34c6bc" } },
              ],
            },
          ],
        },
      },
      {
        id: "choices",
        component: "Card",
        label: "定制课堂活动",
        description: "选择侧重点，交给右侧智能体继续设计。",
        children: ["focus-select", "solutions"],
      },
      {
        id: "focus-select",
        component: "Select",
        label: "教学侧重点",
        options: ["专业工程案例", "公式变量辨析", "分层练习"],
      },
      { id: "solutions", component: "Checkbox", label: "附教师参考解答" },
      {
        id: "intro",
        component: "Text",
        text: "示例：从传热机制到努塞尔数，完成课堂互动与再教学设计。",
      },
      {
        id: "math",
        component: "Markdown",
        text: "### 传热公式\n对流传热：$q=h\\Delta T$。\n\n$\nNu=\\frac{hL}{\\lambda}\n$\n\n| 符号 | 含义 |\n| --- | --- |\n| h | 对流换热系数 |\n| L | 特征长度 |",
      },
      {
        id: "diagram",
        component: "Mermaid",
        code: "flowchart LR\n A[传热机制] --> B[导热]\n A --> C[对流]\n C --> D[努塞尔数 Nu]\n D --> E[课堂练习与反馈]",
      },
      { id: "form", component: "TextField", label: "需要重点讲解的知识点 / Focus topic" },
      {
        id: "ask",
        component: "Button",
        label: "生成再教学活动 / Design activity",
        prompt: "根据画布中填写的知识点，生成再教学活动，并更新左侧教案及智能画布。",
      },
      {
        id: "html",
        component: "Html",
        html: '<style>h3{color:#2563eb}</style><h3>课堂互动卡</h3><p>Nu 表征对流换热相对于纯导热的增强程度。</p><button data-jzx-prompt="请生成一道努塞尔数辨析题">生成辨析题</button>',
      },
      {
        id: "table",
        component: "Table",
        columns: ["知识点", "课堂活动"],
        rows: [
          ["对流换热", "边界层观察"],
          ["Nu", "量纲辨析"],
        ],
      },
    ],
  }) +
  "\n```";
