---
name: courseware-outline
description: "生成专业课完整课件PPT内容与讲稿结构（幻灯片页序、讲解要点、互动问题）。输出到 outputs/courseware/。"
when_to_use: "教师要求做课件、PPT 提纲、讲稿结构、幻灯片大纲时使用。"
---

# 课件提纲（courseware-outline）

面向高校专业课教师。演示工作区默认课程为《材料加工冶金与传输原理》，未另行指定时优先采用该专业语境与术语。

## 输出结构（`outputs/courseware/`）

1. 课件目标与受众
2. 页序提纲（每页：标题、要点 bullet、建议讲解时长、可选图示说明）
3. 互动问题 / 随堂练习插入点
4. 结尾小结与课后延伸
5. 可选：讲稿口述稿（口语化）

## 规则

- 默认 15–25 页量级，可按学时缩放。
- 生成完整逐页正文与独立讲稿，不能用提纲标题替代正文。教学工作台负责生成可编辑的二进制 PPTX，教师可预览、编辑并点击“下载 PowerPoint”。
- 输出 `jzx-courseware` JSON：`{title,courseName,goals,outline,interactions,scriptNotes,slides:[{title,body,notes}]}`，最多80页，标题120字、正文3000字、讲稿6000字。正文用纯文本及 Unicode 公式，写明变量、单位与适用范围，覆盖专业案例、练习与解答、小结。
- 用户仅要求提纲时可省略 slides；完整 PPT 请求必须包含 slides。
- 文件名：`课件提纲-<课题简称>-YYYYMMDD.md`

## 工作台联动（教智星）

在教学工作台对话中，除写入 outputs/ 外，请尽量附带 `jzx-courseware` JSON 围栏或与左侧编辑器一致的 Markdown 标题，便于一键应用。
