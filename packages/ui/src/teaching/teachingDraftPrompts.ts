import type { DraftSuggestedPromptItem } from "@/v4/draftSuggestedPromptItems.js";

/** 子页面与新建任务共用推荐，PPT任务明确交付实际课件文件，避免旧提纲要求限制生成。 */
export const teachingDraftSuggestedPrompts: DraftSuggestedPromptItem[] = [
  {
    id: "teaching-draft-lesson-plan",
    iconName: "NotebookPen",
    label: {
      cn: "写一节传输原理教案",
      en: "Draft a transport-principles lesson",
    },
    prompt: {
      cn: "请参考当前工作区《材料加工冶金与传输原理》课程资料，围绕“对流传热与努塞尔数”设计一节 2 学时教案，包含教学目标、OBE 对齐、重难点、课堂活动与时间分配、思政融入及课后任务。将完整教案展示在左侧画布，并保存到 outputs/lesson-plans/，供我审阅修改。",
      en: "Using the current workspace course materials for Materials Processing, Metallurgy & Transport Principles, design a 2-hour lesson on convection and Nusselt number, including objectives, OBE alignment, key difficulties, timed activities, values education and homework. Show the complete lesson on the left canvas and save it to outputs/lesson-plans/ for teacher review.",
    },
  },
  {
    id: "teaching-draft-courseware",
    iconName: "Presentation",
    label: {
      cn: "制作完整教学 PPT",
      en: "Create a complete teaching PPT",
    },
    prompt: {
      cn: "请为《材料加工冶金与传输原理》的“对流传热与努塞尔数”制作约 18 页完整教学 PPT。参考当前工作区课程资料，包含学习目标、专业案例、核心公式及变量和适用条件、课堂互动、练习与参考解答、小结，并撰写逐页讲稿。请生成可编辑的 .pptx 文件，保存到 outputs/courseware/，展示完整页内容和产物，支持左侧预览与下载。",
      en: "Create a complete, approximately 18-slide teaching PPT on convection and Nusselt number for Materials Processing, Metallurgy & Transport Principles. Use current workspace course materials and include objectives, professional cases, formulas with variables and assumptions, interactions, exercises with solutions, a summary and individual speaker notes. Generate an editable .pptx file in outputs/courseware/ and show complete slide content and the artifact on the left for preview and download.",
    },
  },
  {
    id: "teaching-draft-exam",
    iconName: "BookOpenCheck",
    label: {
      cn: "按知识点智能组卷",
      en: "Build an exam paper",
    },
    prompt: {
      cn: "请按《材料加工冶金与传输原理》课程知识点组一份 100 分测验，覆盖动量、热量、质量传递与加热炉热平衡，合理安排题型、难度与分值。生成学生卷、教师答案及评分标准、双向细目表，展示在左侧画布并保存到 outputs/exams/，供我核验。",
      en: "Assemble a 100-point quiz for Materials Processing, Metallurgy & Transport Principles covering momentum, heat and mass transfer and furnace heat balance, with balanced question types and difficulty. Produce the student paper, teacher solutions with marking criteria and a knowledge-by-question blueprint. Show them on the left canvas and save to outputs/exams/ for teacher review.",
    },
  },
  {
    id: "teaching-draft-review",
    iconName: "ClipboardCheck",
    label: {
      cn: "辅助评阅脱敏作业",
      en: "Review anonymized homework",
    },
    prompt: {
      cn: "请按课程知识点与评分标准辅助评阅当前工作区的脱敏作业，优先参考 analytics/作业样例-脱敏.md。逐题给出建议分、评分依据、错误归类与改进反馈，汇总共性问题。将结果展示在左侧并保存到 outputs/reviews/，标注供教师审定；没有作业时先提示我提供，不编造学生结果。",
      en: "Review anonymized homework in the current workspace against course knowledge and marking criteria, preferring analytics/作业样例-脱敏.md if available. Provide per-question suggested scores, reasons, error categories, feedback and common misconceptions. Show results on the left and save to outputs/reviews/ for teacher confirmation. Ask for homework if missing; do not invent student results.",
    },
  },
  {
    id: "teaching-draft-analytics",
    iconName: "BarChart3",
    label: {
      cn: "分析薄弱知识点",
      en: "Analyze weak knowledge points",
    },
    prompt: {
      cn: "请分析当前工作区的脱敏班级答题数据，优先参考 analytics/班级答题统计-脱敏.md，识别《材料加工冶金与传输原理》的薄弱知识点、典型错因与教学改进方向。给出图表、再教学活动和分层练习建议，展示在左侧画布并保存到 outputs/reviews/；缺少数据时说明所需字段，不编造成效。",
      en: "Analyze anonymized class response data in the current workspace, preferring analytics/班级答题统计-脱敏.md if available. Identify weak knowledge points and misconceptions in Materials Processing, Metallurgy & Transport Principles. Provide charts, reteaching activities and differentiated exercises on the left canvas and in outputs/reviews/. If data is missing, request the needed fields; do not invent outcomes.",
    },
  },
  {
    id: "teaching-draft-lab",
    iconName: "FlaskConical",
    label: {
      cn: "生成传热实验指导书",
      en: "Generate a heat-transfer lab guide",
    },
    prompt: {
      cn: "请为《圆管强制对流换热》制作完整实验/实训指导书，包含教学目标、实验原理与公式、设备清单、操作步骤、安全与异常处理、数据记录表、结果分析及评分量表。使用脱敏示例，将材料展示在左侧画布并保存到 outputs/lab/，供教师核验后使用。",
      en: "Create a complete forced-convection-in-a-tube lab guide with objectives, principles and formulas, equipment, procedures, safety and abnormal-condition handling, data tables, result analysis and a grading rubric. Use anonymized examples, show the materials on the left canvas and save to outputs/lab/ for teacher verification.",
    },
  },
  {
    id: "teaching-draft-case",
    iconName: "Sparkles",
    label: {
      cn: "挖掘一则冶金传热案例",
      en: "Mine a metallurgy heat-transfer case",
    },
    prompt: {
      cn: "请围绕加热炉热平衡或凝固传热整理一则《材料加工冶金与传输原理》专业教学案例，包含背景、核心知识点、数据与假设、问题链、课堂讨论和教师参考分析。真实资料注明来源，模拟数据明确标注并脱敏。展示在左侧画布并保存到 outputs/cases/。",
      en: "Develop a professional teaching case on furnace heat balance or solidification heat transfer for Materials Processing, Metallurgy & Transport Principles. Include background, core concepts, data and assumptions, a sequence of questions, classroom discussion and teacher analysis. Cite real sources and clearly label simulated, anonymized data. Show it on the left canvas and save to outputs/cases/.",
    },
  },
];
