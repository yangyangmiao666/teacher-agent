---
name: echarts-ai-skill
description: Generate charts from natural language or tabular data, recommend chart types, and export ECharts-based HTML or SVG. Use when users ask for one-sentence chart generation, auto chart selection from data, or embeddable chart previews.
metadata:
  short-description: Skill-first ECharts toolkit for agent chart workflows
  openclaw:
    slug: echarts-ai-skill
    version: 0.1.4
    license: MIT
    homepage: https://github.com/davaded/Echarts-AI-Skill
    repository: https://github.com/davaded/Echarts-AI-Skill
---

## 教智星运行约定

本技能随教智星 Agent 内置。以下 scripts/、references/、字体等路径均相对本技能目录；执行脚本请用加载结果中的技能绝对路径。产物保存到当前工作区 outputs/office/，并返回实际文件路径。生成示例只能使用虚构或脱敏数据。办公处理在本地/服务器执行，不将学生、企业或校内平台数据上传到远程执行服务。教师请求优先于技能中的流程建议。Python 依赖见技能包 office-requirements.txt；Linux 镜像已配置办公工具。Node 文档脚本优先使用 .cjs 与 require，依赖通过 NODE_PATH 或当前项目解析。已有教学 PPT 编辑器的结构化输出仍采用 jzx-courseware slides 协议。


# ECharts Chart Skill

Use this skill when the user wants chart output from a short description or from table-like data.

## Workflow

1. Translate the user's request into a `ChartRequest` JSON object.
2. If the chart type is unclear, run the recommendation command first.
3. Run the generation command to produce a stable ECharts option.
4. Run the render command when the user wants an embeddable `html` or `svg`.

## Files

- Core types: `src/types/chart.ts`
- Chart recommendation: `src/core/recommend.ts`
- Option generation: `src/core/spec-to-option.ts`
- Rendering: `src/core/render.ts`
- Sample input: `examples/study-progress.request.json`
- Universal metadata: `manifest.yaml`, `agents/openai.yaml`

## Setup

```powershell
npm install
```

## Output rules

- `--out` writes to an exact file path.
- `--out-dir` writes the default file into a directory you choose.
- `desktop` and `home` are valid aliases for `--out-dir` when the user explicitly asks for those locations.
- `~` is expanded to the current user's home directory.
- If no output path is provided, files default to the current working directory.

## Commands

```powershell
node dist/cli/recommend-chart.js --input examples\study-progress.request.json
node dist/cli/generate-chart.js --input examples\study-progress.request.json
node dist/cli/render-chart.js --input option.json --format html
node dist/cli/render-chart.js --input option.json --format svg --out D:\reports\study-chart.svg
```

Default output filenames:

- Recommendation: `spec.json`
- Option: `option.json`
- HTML preview: `preview.html`
- SVG preview: `preview.svg`

## `ChartRequest` shape

```json
{
  "title": "Monthly study completion",
  "dataset": [
    { "day": "2026-03-01", "completionRate": 62, "targetRate": 75 },
    { "day": "2026-03-02", "completionRate": 68, "targetRate": 75 }
  ],
  "goal": "trend",
  "xField": "day",
  "yField": "completionRate",
  "series": [
    { "name": "Completion", "field": "completionRate" },
    { "name": "Target", "field": "targetRate" }
  ]
}
```

## Guidance

- Prefer deterministic field mapping over free-form inference when the user has already named fields.
- For pie charts, keep one category field and one metric field.
- For scatter charts, require numeric `xField` and `yField`.
- If the user only gave natural language, construct the smallest valid `ChartRequest` before calling scripts.
- If the user needs a report artifact, render `html` first and `svg` second.

