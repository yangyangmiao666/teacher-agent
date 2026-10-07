import { teachingCoursewarePatchSchema } from "./teachingCoursewareSchema.js";
import { teachingExamSchema } from "./teachingExamSchema.js";
/* oxlint-disable eslint(max-lines) -- 七子台 Markdown/JSON 解析集中维护，拆散会让别名表失同步。 */
/**
 * 将智能体回复解析为教学工作台结构化补丁。
 * 支持：与导出 Markdown 同构的标题；以及 ```jzx-<kind>``` JSON 围栏（高置信）。
 */
import {
  normalizeExamQuestionType,
  type ExamQuestion,
  type HomeworkSubmission,
  type KnowledgeStat,
  type TeachingCase,
  type TeachingCourseware,
  type TeachingLabMaterial,
  type TeachingLessonPlan,
  type TeachingPanelId,
} from "@/teaching/teachingTypes.js";

export type TeachingApplyKind =
  | "lesson"
  | "courseware"
  | "case"
  | "exam"
  | "review"
  | "analytics"
  | "lab";

export interface TeachingApplyCandidate {
  kind: TeachingApplyKind;
  panelId: TeachingPanelId;
  /** 0–1，匹配字段越多越高；JSON 围栏起步更高。 */
  confidence: number;
  fieldIds: string[];
  source: "json-fence" | "markdown-headings";
  lesson?: Partial<TeachingLessonPlan>;
  courseware?: Partial<TeachingCourseware>;
  caseItem?: Partial<TeachingCase>;
  lab?: Partial<TeachingLabMaterial>;
  questions?: Array<Omit<ExamQuestion, "id"> & { id?: string }>;
  paperTitle?: string;
  review?: Partial<HomeworkSubmission> & { aliasHint?: string };
  knowledgeStats?: KnowledgeStat[];
}

const PANEL_KIND: Record<TeachingPanelId, TeachingApplyKind> = {
  "lesson-editor": "lesson",
  "courseware-editor": "courseware",
  "case-library": "case",
  "exam-builder": "exam",
  "review-desk": "review",
  "analytics-board": "analytics",
  "lab-editor": "lab",
};

const KIND_PANEL: Record<TeachingApplyKind, TeachingPanelId> = {
  lesson: "lesson-editor",
  courseware: "courseware-editor",
  case: "case-library",
  exam: "exam-builder",
  review: "review-desk",
  analytics: "analytics-board",
  lab: "lab-editor",
};

function normalizeHeading(raw: string): string {
  return raw
    .replace(/[#*\s]/g, "")
    .trim()
    .toLowerCase();
}

function sectionMap(markdown: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let current = "_preamble";
  const buckets: Record<string, string[]> = { _preamble: [] };
  for (const line of lines) {
    // 仅按二级/三级标题分节，保留一级标题与其下元信息同属 preamble。
    const heading = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      current = normalizeHeading(heading[2] ?? "");
      if (!buckets[current]) buckets[current] = [];
      continue;
    }
    (buckets[current] ??= []).push(line);
  }
  for (const [key, value] of Object.entries(buckets)) {
    map.set(key, value.join("\n").trim());
  }
  return map;
}

function pickSection(sections: Map<string, string>, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const key = normalizeHeading(alias);
    const hit = sections.get(key);
    if (hit?.trim()) return hit.trim();
  }
  // 模糊包含
  for (const alias of aliases) {
    const key = normalizeHeading(alias);
    for (const [name, body] of sections) {
      if (name.includes(key) || key.includes(name)) {
        if (body.trim()) return body.trim();
      }
    }
  }
  return undefined;
}

function metaLine(preamble: string, labels: string): string | undefined {
  for (const label of labels.split("|")) {
    const pattern = new RegExp(`^[-*]\\s*${label.trim()}\\s*[:：]\\s*(.+)$`, "im");
    const match = pattern.exec(preamble);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return undefined;
}

function titleFromMarkdown(markdown: string, prefixes: string[]): string | undefined {
  const h1 = /^#\s+(.+)$/m.exec(markdown);
  if (!h1?.[1]) return undefined;
  let title = h1[1].trim();
  for (const prefix of prefixes) {
    if (title.startsWith(prefix)) title = title.slice(prefix.length).trim();
  }
  return title || undefined;
}

function extractJsonFences(markdown: string): Array<{ kind: string; json: string }> {
  const results: Array<{ kind: string; json: string }> = [];
  const re = /```jzx-([a-z-]+)\s*\n([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown))) {
    results.push({ kind: (match[1] ?? "").toLowerCase(), json: (match[2] ?? "").trim() });
  }
  return results;
}

function scoreFields(fieldIds: string[], expected: number): number {
  if (expected <= 0) return 0;
  return Math.min(1, fieldIds.length / expected);
}

function parseLessonMarkdown(markdown: string): TeachingApplyCandidate | null {
  const sections = sectionMap(markdown);
  const preamble = sections.get("_preamble") ?? "";
  const fieldIds: string[] = [];
  const lesson: Partial<TeachingLessonPlan> = {};
  const title = titleFromMarkdown(markdown, ["教案：", "教案:", "Lesson:"]);
  if (title) {
    lesson.title = title;
    fieldIds.push("title");
  }
  const courseName = metaLine(preamble, "课程|Course");
  if (courseName) {
    lesson.courseName = courseName;
    fieldIds.push("courseName");
  }
  const hoursRaw = metaLine(preamble, "学时|Hours");
  if (hoursRaw) {
    const hours = Number.parseFloat(hoursRaw);
    if (Number.isFinite(hours)) {
      lesson.hours = hours;
      fieldIds.push("hours");
    }
  }
  const audience = metaLine(preamble, "授课对象|Audience");
  if (audience) {
    lesson.audience = audience;
    fieldIds.push("audience");
  }
  const mappings: Array<[keyof TeachingLessonPlan, string[], string]> = [
    ["objectives", ["教学目标", "目标", "objectives", "learning objectives"], "objectives"],
    ["keyPoints", ["教学重点", "重点", "key points"], "keyPoints"],
    ["difficulties", ["教学难点", "难点", "difficulties"], "difficulties"],
    ["process", ["教学过程", "过程", "process", "教学流程"], "process"],
    ["ideologyNotes", ["思政融入", "思政", "ideology"], "ideologyNotes"],
    ["homework", ["课后任务", "作业", "homework"], "homework"],
  ];
  for (const [key, aliases, fieldId] of mappings) {
    const value = pickSection(sections, aliases);
    if (value) {
      (lesson as Record<string, unknown>)[key] = value;
      fieldIds.push(fieldId);
    }
  }
  const obeBody = pickSection(sections, ["成果导向对齐", "OBE", "课程目标对齐", "outcome"]);
  if (obeBody) {
    const items: Array<{ id: string; code: string; statement: string; covered: boolean }> = [];
    for (const line of obeBody.split("\n")) {
      const m = /^[-*]\s*\[([ xX])\]\s*(\S+)\s+(.+)$/.exec(line.trim());
      if (!m) continue;
      items.push({
        id: `obe-${(m[2] ?? "").toLowerCase()}`,
        code: m[2] ?? "",
        statement: (m[3] ?? "").trim(),
        covered: (m[1] ?? "").toLowerCase() === "x",
      });
    }
    if (items.length) {
      lesson.outcomeAlignment = items;
      fieldIds.push("outcomeAlignment");
    }
  }
  if (fieldIds.length < 2) return null;
  return {
    kind: "lesson",
    panelId: "lesson-editor",
    confidence: scoreFields(fieldIds, 9),
    fieldIds,
    source: "markdown-headings",
    lesson,
  };
}

function parseCoursewareMarkdown(markdown: string): TeachingApplyCandidate | null {
  const sections = sectionMap(markdown);
  const preamble = sections.get("_preamble") ?? "";
  const fieldIds: string[] = [];
  const courseware: Partial<TeachingCourseware> = {};
  const title = titleFromMarkdown(markdown, ["课件提纲：", "课件：", "Courseware:"]);
  if (title) {
    courseware.title = title;
    fieldIds.push("title");
  }
  const courseName = metaLine(preamble, "课程|Course");
  if (courseName) {
    courseware.courseName = courseName;
    fieldIds.push("courseName");
  }
  const mappings: Array<[keyof TeachingCourseware, string[], string]> = [
    ["goals", ["目标", "课件目标", "goals"], "goals"],
    ["outline", ["页序提纲", "提纲", "outline", "页序"], "outline"],
    ["interactions", ["互动插入点", "互动", "interactions"], "interactions"],
    ["scriptNotes", ["讲稿要点", "讲稿", "script"], "scriptNotes"],
  ];
  for (const [key, aliases, fieldId] of mappings) {
    const value = pickSection(sections, aliases);
    if (value) {
      (courseware as Record<string, unknown>)[key] = value;
      fieldIds.push(fieldId);
    }
  }
  if (fieldIds.length < 2) return null;
  return {
    kind: "courseware",
    panelId: "courseware-editor",
    confidence: scoreFields(fieldIds, 6),
    fieldIds,
    source: "markdown-headings",
    courseware,
  };
}

function parseCaseMarkdown(markdown: string): TeachingApplyCandidate | null {
  const sections = sectionMap(markdown);
  const preamble = sections.get("_preamble") ?? "";
  const fieldIds: string[] = [];
  const caseItem: Partial<TeachingCase> = {};
  const title = titleFromMarkdown(markdown, ["教学案例：", "案例：", "Case:"]);
  if (title) {
    caseItem.title = title;
    fieldIds.push("title");
  }
  const courseName = metaLine(preamble, "课程|Course");
  if (courseName) {
    caseItem.courseName = courseName;
    fieldIds.push("courseName");
  }
  const knowledge = metaLine(preamble, "知识点|Knowledge");
  if (knowledge) {
    caseItem.knowledgeLabel = knowledge;
    fieldIds.push("knowledgeLabel");
  }
  const mappings: Array<[keyof TeachingCase, string[], string]> = [
    ["background", ["背景", "background"], "background"],
    ["problem", ["核心问题", "问题", "problem"], "problem"],
    ["analysis", ["分析路径", "分析", "教师参考", "analysis"], "analysis"],
    ["discussion", ["讨论题", "讨论", "discussion"], "discussion"],
    ["desensitization", ["脱敏说明", "脱敏", "desensitization"], "desensitization"],
  ];
  for (const [key, aliases, fieldId] of mappings) {
    const value = pickSection(sections, aliases);
    if (value) {
      (caseItem as Record<string, unknown>)[key] = value;
      fieldIds.push(fieldId);
    }
  }
  if (fieldIds.length < 2) return null;
  return {
    kind: "case",
    panelId: "case-library",
    confidence: scoreFields(fieldIds, 7),
    fieldIds,
    source: "markdown-headings",
    caseItem,
  };
}

function parseLabMarkdown(markdown: string): TeachingApplyCandidate | null {
  const sections = sectionMap(markdown);
  const preamble = sections.get("_preamble") ?? "";
  const fieldIds: string[] = [];
  const lab: Partial<TeachingLabMaterial> = {};
  const title = titleFromMarkdown(markdown, ["实训指导书：", "实验指导书：", "Lab:"]);
  if (title) {
    lab.title = title;
    fieldIds.push("title");
  }
  const courseName = metaLine(preamble, "课程|Course");
  if (courseName) {
    lab.courseName = courseName;
    fieldIds.push("courseName");
  }
  const mappings: Array<[keyof TeachingLabMaterial, string[], string]> = [
    ["objectives", ["目的", "实验目的", "objectives"], "objectives"],
    ["principle", ["原理摘要", "原理", "principle"], "principle"],
    ["equipment", ["器材", "设备", "equipment"], "equipment"],
    ["steps", ["步骤", "实验步骤", "steps"], "steps"],
    ["safety", ["安全须知", "安全", "safety"], "safety"],
    ["dataSheet", ["数据记录表", "数据表", "data"], "dataSheet"],
    ["rubric", ["评分量表", "评分", "rubric"], "rubric"],
  ];
  for (const [key, aliases, fieldId] of mappings) {
    const value = pickSection(sections, aliases);
    if (value) {
      (lab as Record<string, unknown>)[key] = value;
      fieldIds.push(fieldId);
    }
  }
  if (fieldIds.length < 2) return null;
  return {
    kind: "lab",
    panelId: "lab-editor",
    confidence: scoreFields(fieldIds, 8),
    fieldIds,
    source: "markdown-headings",
    lab,
  };
}

function parseExamMarkdown(markdown: string): TeachingApplyCandidate | null {
  const fieldIds: string[] = [];
  const paperTitle = titleFromMarkdown(markdown, ["试卷：", "测验：", "Exam:", "Quiz:"]);
  const questions: Array<Omit<ExamQuestion, "id"> & { id?: string }> = [];
  // 题块：### 1. ... 或 **题1**
  const blocks = markdown.split(/\n(?=###\s+|\n\*\*(?:题|Q)\s*\d+)/i);
  for (const block of blocks) {
    const stemMatch =
      /(?:###\s+\d+[.\s、:：]*|^\*\*(?:题|Q)\s*\d+[.\s、:：]*\*\*)\s*([\s\S]+?)(?=\n(?:答案|参考答案|Answer|知识点|难度|分值|题型)[:：]|\n###\s+|$)/i.exec(
        block,
      );
    if (!stemMatch?.[1]) continue;
    const stem = stemMatch[1].trim();
    if (stem.length < 4) continue;
    const typeRaw = /(?:题型|Type)\s*[:：]\s*(\S+)/i.exec(block)?.[1] ?? "short";
    const knowledgeLabel =
      /(?:知识点|Knowledge)\s*[:：]\s*(.+)$/im.exec(block)?.[1]?.trim() ?? "综合";
    const difficultyRaw = /(?:难度|Difficulty)\s*[:：]\s*(\S+)/i.exec(block)?.[1] ?? "medium";
    const scoreRaw = /(?:分值|Score)\s*[:：]\s*(\d+)/i.exec(block)?.[1];
    const answer =
      /(?:答案|参考答案|Answer)\s*[:：]\s*([\s\S]+?)(?=\n(?:题型|知识点|难度|分值|###)|$)/i
        .exec(block)?.[1]
        ?.trim() ?? "";
    const difficulty = /难|hard/i.test(difficultyRaw)
      ? "hard"
      : /易|easy/i.test(difficultyRaw)
        ? "easy"
        : "medium";
    const type = normalizeExamQuestionType(
      /单选|single/i.test(typeRaw)
        ? "single"
        : /填空|fill/i.test(typeRaw)
          ? "fill"
          : /计算|calc|code/i.test(typeRaw)
            ? "calc"
            : "short",
    );
    questions.push({
      type,
      knowledgeId: knowledgeLabel.slice(0, 24),
      knowledgeLabel,
      difficulty,
      stem,
      answer,
      score: scoreRaw ? Number.parseInt(scoreRaw, 10) || 5 : 5,
    });
  }
  if (questions.length === 0) return null;
  fieldIds.push("questions");
  if (paperTitle) fieldIds.push("paperTitle");
  return {
    kind: "exam",
    panelId: "exam-builder",
    confidence: Math.min(1, 0.35 + questions.length * 0.12),
    fieldIds,
    source: "markdown-headings",
    questions,
    ...(paperTitle ? { paperTitle } : {}),
  };
}

function parseReviewMarkdown(markdown: string): TeachingApplyCandidate | null {
  const fieldIds: string[] = [];
  const review: Partial<HomeworkSubmission> & { aliasHint?: string } = {};
  const scoreMatch = /(?:建议分|得分|Score)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+))?/i.exec(
    markdown,
  );
  if (scoreMatch?.[1]) {
    review.suggestedScore = Number.parseFloat(scoreMatch[1]);
    fieldIds.push("suggestedScore");
    if (scoreMatch[2]) {
      review.maxScore = Number.parseFloat(scoreMatch[2]);
      fieldIds.push("maxScore");
    }
  }
  const feedback =
    pickSection(sectionMap(markdown), ["反馈", "评语", "feedback", "教师反馈"]) ??
    /【建议分[\s\S]+/.exec(markdown)?.[0] ??
    undefined;
  if (feedback) {
    review.feedback = feedback.trim();
    fieldIds.push("feedback");
  }
  const alias = /(?:学生|别名|Alias)\s*[:：]\s*(.+)$/im.exec(markdown)?.[1]?.trim();
  if (alias) {
    review.aliasHint = alias;
    fieldIds.push("aliasHint");
  }
  if (fieldIds.length < 1) return null;
  return {
    kind: "review",
    panelId: "review-desk",
    confidence: scoreFields(fieldIds, 3),
    fieldIds,
    source: "markdown-headings",
    review,
  };
}

function parseAnalyticsMarkdown(markdown: string): TeachingApplyCandidate | null {
  const stats: KnowledgeStat[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    // | 知识点 | 均分率 | 低于60%占比 | 再教学 |
    const pipe =
      /^\|\s*([^|]+)\s*\|\s*(\d+(?:\.\d+)?)%?\s*\|\s*(\d+(?:\.\d+)?)%?\s*\|\s*([^|]*)\|/.exec(line);
    if (pipe) {
      const label = pipe[1]?.trim() ?? "";
      if (!label || /知识点|label/i.test(label)) continue;
      stats.push({
        knowledgeId: label.slice(0, 24),
        label,
        avgScoreRate: Number.parseFloat(pipe[2] ?? "0"),
        belowSixtyRate: Number.parseFloat(pipe[3] ?? "0"),
        ...(pipe[4]?.trim() ? { reteachHint: pipe[4].trim() } : {}),
      });
      continue;
    }
    // - 努塞尔数：均分 42%，低于60% 占比 68%。建议：...
    const bullet =
      /^[-*]\s*(.+?)[:：]\s*(?:均分|得分率)?\s*(\d+(?:\.\d+)?)%\s*.*?(?:低于\s*60%|薄弱)[^\d]*(\d+(?:\.\d+)?)%\s*(?:[。.;；]\s*(?:建议|再教学)[:：]?\s*(.+))?/i.exec(
        line,
      );
    if (bullet) {
      stats.push({
        knowledgeId: (bullet[1] ?? "").trim().slice(0, 24),
        label: (bullet[1] ?? "").trim(),
        avgScoreRate: Number.parseFloat(bullet[2] ?? "0"),
        belowSixtyRate: Number.parseFloat(bullet[3] ?? "0"),
        ...(bullet[4]?.trim() ? { reteachHint: bullet[4].trim() } : {}),
      });
    }
  }
  if (stats.length === 0) return null;
  return {
    kind: "analytics",
    panelId: "analytics-board",
    confidence: Math.min(1, 0.4 + stats.length * 0.1),
    fieldIds: ["knowledgeStats"],
    source: "markdown-headings",
    knowledgeStats: stats,
  };
}

function parseJsonFence(kind: string, jsonText: string): TeachingApplyCandidate | null {
  try {
    const data = JSON.parse(jsonText) as Record<string, unknown>;
    const normalized = kind.replace(/^jzx-/, "");
    if (normalized === "lesson" || normalized === "lesson-plan") {
      const fieldIds = Object.keys(data);
      return {
        kind: "lesson",
        panelId: "lesson-editor",
        confidence: Math.min(1, 0.55 + fieldIds.length * 0.05),
        fieldIds,
        source: "json-fence",
        lesson: data as Partial<TeachingLessonPlan>,
      };
    }
    if (normalized === "courseware" || normalized === "courseware-outline") {
      // 原先直接断言 JSON 类型可能写入非法页面；先整份校验，失败不改草稿。
      const result = teachingCoursewarePatchSchema.safeParse(data);
      if (!result.success) return null;
      const fieldIds = Object.keys(result.data);
      return {
        kind: "courseware",
        panelId: "courseware-editor",
        confidence: result.data.slides ? 0.95 : Math.min(1, 0.55 + fieldIds.length * 0.05),
        fieldIds,
        source: "json-fence",
        courseware: result.data,
      };
    }
    if (normalized === "case" || normalized === "case-mining") {
      return {
        kind: "case",
        panelId: "case-library",
        confidence: 0.85,
        fieldIds: Object.keys(data),
        source: "json-fence",
        caseItem: data as Partial<TeachingCase>,
      };
    }
    if (normalized === "lab" || normalized === "lab-practicum") {
      return {
        kind: "lab",
        panelId: "lab-editor",
        confidence: 0.85,
        fieldIds: Object.keys(data),
        source: "json-fence",
        lab: data as Partial<TeachingLabMaterial>,
      };
    }
    if (normalized === "exam" || normalized === "exam-paper") {
      // JSON 类型断言不会校验运行时数据；数字 id 曾在自动应用时触发 trim 崩溃。
      const result = teachingExamSchema.safeParse(data);
      if (!result.success) return null;
      return {
        kind: "exam",
        panelId: "exam-builder",
        confidence: 0.9,
        fieldIds: ["questions", ...(result.data.title ? ["paperTitle"] : [])],
        source: "json-fence",
        questions: result.data.questions,
        ...(result.data.title !== undefined ? { paperTitle: result.data.title } : {}),
      };
    }
    if (normalized === "review" || normalized === "homework-review") {
      return {
        kind: "review",
        panelId: "review-desk",
        confidence: 0.85,
        fieldIds: Object.keys(data),
        source: "json-fence",
        review: data as TeachingApplyCandidate["review"],
      };
    }
    if (normalized === "analytics" || normalized === "learning-analytics") {
      const knowledgeStats = Array.isArray(data.knowledgeStats)
        ? (data.knowledgeStats as KnowledgeStat[])
        : Array.isArray(data.stats)
          ? (data.stats as KnowledgeStat[])
          : [];
      if (!knowledgeStats.length) return null;
      return {
        kind: "analytics",
        panelId: "analytics-board",
        confidence: 0.9,
        fieldIds: ["knowledgeStats"],
        source: "json-fence",
        knowledgeStats,
      };
    }
  } catch {
    return null;
  }
  return null;
}

const MARKDOWN_PARSERS: Record<
  TeachingApplyKind,
  (markdown: string) => TeachingApplyCandidate | null
> = {
  lesson: parseLessonMarkdown,
  courseware: parseCoursewareMarkdown,
  case: parseCaseMarkdown,
  exam: parseExamMarkdown,
  review: parseReviewMarkdown,
  analytics: parseAnalyticsMarkdown,
  lab: parseLabMarkdown,
};

/** 针对当前子台优先解析；否则尝试其它子台结构。 */
export function parseTeachingApplyCandidate(
  markdown: string,
  preferredPanelId?: TeachingPanelId,
): TeachingApplyCandidate | null {
  const text = markdown.trim();
  if (!text) return null;

  for (const fence of extractJsonFences(text)) {
    const fromJson = parseJsonFence(fence.kind, fence.json);
    if (fromJson) {
      if (!preferredPanelId || fromJson.panelId === preferredPanelId) return fromJson;
    } else if (
      ["courseware", "courseware-outline"].includes(fence.kind) &&
      (!preferredPanelId || preferredPanelId === "courseware-editor")
    ) {
      // 已声明完整课件但结构非法时不能退回 Markdown 解析造成部分应用。
      return null;
    } else if (
      ["exam", "exam-paper"].includes(fence.kind) &&
      (!preferredPanelId || preferredPanelId === "exam-builder")
    ) {
      // 非法组卷 JSON 必须整份拒绝，不能从周围标题误解析成部分组卷或教案。
      return null;
    }
  }

  if (preferredPanelId) {
    const preferred = MARKDOWN_PARSERS[PANEL_KIND[preferredPanelId]](text);
    if (preferred && preferred.confidence >= 0.25) return preferred;
  }

  let best: TeachingApplyCandidate | null = null;
  for (const kind of Object.keys(MARKDOWN_PARSERS) as TeachingApplyKind[]) {
    if (preferredPanelId && KIND_PANEL[kind] === preferredPanelId) continue;
    const candidate = MARKDOWN_PARSERS[kind](text);
    if (!candidate) continue;
    if (!best || candidate.confidence > best.confidence) best = candidate;
  }
  return best && best.confidence >= 0.3
    ? best
    : preferredPanelId
      ? MARKDOWN_PARSERS[PANEL_KIND[preferredPanelId]](text)
      : best;
}

export function teachingApplyKindForPanel(panelId: TeachingPanelId): TeachingApplyKind {
  return PANEL_KIND[panelId];
}
