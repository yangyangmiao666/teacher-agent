import {
  buildCaseMarkdown,
  buildCoursewareMarkdown,
  buildLabMarkdown,
  buildLessonMarkdown,
} from "@/teaching/teachingSeed.js";
import type { TeachingPanelId, TeachingWorkspaceData } from "@/teaching/teachingTypes.js";
import { TEACHING_PANEL_SKILLS, TEACHING_PANELS } from "@/teaching/teachingTypes.js";

/** 左侧当前内容 → 右侧对话上下文附录（可见注入到用户提示）。 */
export function buildTeachingContextAppendix(
  panelId: TeachingPanelId,
  data: TeachingWorkspaceData,
  locale: string,
): string {
  const isZh = locale.startsWith("zh");
  const meta = TEACHING_PANELS.find((item) => item.id === panelId);
  const skill = TEACHING_PANEL_SKILLS[panelId];
  const header = isZh
    ? `【教学工作台上下文 · ${meta?.id ?? panelId} · 技能 $${skill}】`
    : `[Teaching workbench context · ${meta?.id ?? panelId} · skill $${skill}]`;

  const formatHint = isZh
    ? [
        "请直接生成可写入左侧编辑器的结构化内容。优先使用与导出一致的 Markdown 标题；",
        "若可能，另附 ```jzx-" +
          (panelId === "lesson-editor"
            ? "lesson"
            : panelId === "courseware-editor"
              ? "courseware"
              : panelId === "case-library"
                ? "case"
                : panelId === "lab-editor"
                  ? "lab"
                  : panelId === "exam-builder"
                    ? "exam"
                    : panelId === "review-desk"
                      ? "review"
                      : "analytics") +
          "``` JSON 围栏以便一键高置信应用。",
      ].join("")
    : "Produce structured content matching the left editor. Prefer export-compatible Markdown headings; optionally add a ```jzx-*``` JSON fence for one-click apply.";

  const lessonHint =
    panelId === "lesson-editor"
      ? isZh
        ? "教案请包含成果导向对齐（OBE）清单。"
        : "Include OBE alignment for lesson plans."
      : "";
  const coursewareHint =
    panelId === "courseware-editor"
      ? isZh
        ? "制作完整课件PPT时请输出 jzx-courseware JSON：{title,courseName,goals,outline,interactions,scriptNotes,slides:[{title,body,notes}]}。slides每页必须含可直接讲授的正文和独立讲稿，覆盖目标、专业案例、公式变量与适用条件、课堂练习及解答、小结；不能只返回提纲或图示建议。最多80页，标题120字、正文3000字、讲稿6000字。PPTX正文用纯文本与Unicode公式；网页可额外用jzx-ui展示公式和图表。"
        : "For a full PPT, return jzx-courseware JSON with title, courseName, goals, outline, interactions, scriptNotes and slides:[{title,body,notes}]. Each slide needs real teaching content and individual notes, including cases, formula assumptions, exercises and solutions. Max 80 slides; title 120, body 3000, notes 6000 characters. Use plain text and Unicode formulas for editable PPTX; use jzx-ui separately for rich diagrams."
      : "";
  const body = buildTeachingPanelDocument(panelId, data, locale);

  return `${header}\n${formatHint}${lessonHint}${coursewareHint}\n\n----- 当前左侧内容 -----\n${body.trim()}\n----- 结束 -----`;
}

export function wrapPromptWithTeachingContext(
  prompt: string,
  appendix: string,
  includeContext: boolean,
): string {
  const body = prompt.trim();
  if (!includeContext || !appendix.trim()) return body;
  if (body.includes("【教学工作台上下文") || body.includes("[Teaching workbench context")) {
    return body;
  }
  return `${body}\n\n${appendix}`;
}

export function buildTeachingPanelDocument(
  panelId: TeachingPanelId,
  data: TeachingWorkspaceData,
  locale: string,
): string {
  const isZh = locale.startsWith("zh");
  let body = "";
  if (panelId === "lesson-editor") {
    const lesson =
      data.lessons.find((item) => item.id === data.activeLessonId) ?? data.lessons[0] ?? null;
    body = lesson
      ? buildLessonMarkdown(lesson)
      : isZh
        ? "（当前无教案，请新建一份完整教案）"
        : "(No lesson yet — create a full lesson plan.)";
  } else if (panelId === "courseware-editor") {
    const item =
      data.coursewares.find((entry) => entry.id === data.activeCoursewareId) ??
      data.coursewares[0] ??
      null;
    body = item
      ? buildCoursewareMarkdown(item)
      : isZh
        ? "（当前无课件提纲）"
        : "(No courseware outline yet.)";
  } else if (panelId === "case-library") {
    const item =
      data.cases.find((entry) => entry.id === data.activeCaseId) ?? data.cases[0] ?? null;
    body = item ? buildCaseMarkdown(item) : isZh ? "（当前无案例）" : "(No case yet.)";
  } else if (panelId === "lab-editor") {
    const item = data.labs.find((entry) => entry.id === data.activeLabId) ?? data.labs[0] ?? null;
    body = item ? buildLabMarkdown(item) : isZh ? "（当前无实训材料）" : "(No lab guide yet.)";
  } else if (panelId === "exam-builder") {
    const selected = data.questions.filter((q) => data.paper.questionIds.includes(q.id));
    const list = (selected.length ? selected : data.questions.slice(0, 5))
      .map(
        (q, index) =>
          `### ${index + 1}. ${q.stem}\n题型：${q.type}\n知识点：${q.knowledgeLabel}\n难度：${q.difficulty}\n分值：${q.score}\n答案：${q.answer}`,
      )
      .join("\n\n");
    const knowledgeMap = data.knowledgeStats.map((s) => `${s.knowledgeId} ${s.label}`).join("；");
    const courseScope = isZh
      ? `课程知识点清单（当前工作台草稿）：${knowledgeMap}\n命题情境：联系材料加工、铸造凝固、加热炉热平衡、轧制变形区、金属中气体扩散及冶金反应器中的动量/热量/质量传递。有知识点筛选时优先筛选项；未筛选时覆盖上述课程范围。以下已选题仅为局部演示参考，不代表全课程。100分组卷应重新规划题目与分值，不直接复制现成答案；缺少课程大纲时注明假设。`
      : `Current workbench knowledge map: ${knowledgeMap}\nUse materials processing and metallurgy contexts: casting/solidification, furnace heat balance, rolling, gas diffusion in metals and coupled transport in reactors. Respect knowledge filters. Selected questions are examples, not the complete syllabus; plan scores and state assumptions.`;
    body = `${courseScope}\n\n# 试卷：${data.paper.title}\n\n筛选：${data.examKnowledgeFilter || "（无）"}\n已选 ${data.paper.questionIds.length} / 题库 ${data.questions.length}\n\n${list}`;
  } else if (panelId === "review-desk") {
    body = data.submissions
      .map(
        (s) =>
          `## ${s.alias}\n题干：${s.prompt}\n作答：${s.answer}\n建议分：${s.suggestedScore ?? "未评"}/${s.maxScore}\n反馈：${s.feedback || "（空）"}`,
      )
      .join("\n\n");
  } else if (panelId === "analytics-board") {
    const rows = data.knowledgeStats
      .map(
        (s) =>
          `| ${s.label} | ${s.avgScoreRate}% | ${s.belowSixtyRate}% | ${s.reteachHint ?? ""} |`,
      )
      .join("\n");
    body = `| 知识点 | 均分率 | 低于60%占比 | 再教学 |\n| --- | --- | --- | --- |\n${rows}`;
  }

  return body.trim();
}
