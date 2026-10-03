export type TeachingPanelId =
  | "lesson-editor"
  | "courseware-editor"
  | "case-library"
  | "exam-builder"
  | "review-desk"
  | "analytics-board"
  | "lab-editor";

export type TeachingStageId = "preclass" | "postclass" | "practicum" | "home";

export interface TeachingOutcomeItem {
  id: string;
  /** 如 CO1 / LO-知识 */
  code: string;
  statement: string;
  covered: boolean;
}

export interface TeachingLessonPlan {
  id: string;
  title: string;
  courseName: string;
  hours: number;
  audience: string;
  objectives: string;
  keyPoints: string;
  difficulties: string;
  process: string;
  ideologyNotes: string;
  homework: string;
  /** OBE/课程目标对齐清单（可选）。 */
  outcomeAlignment?: TeachingOutcomeItem[];
  updatedAt: number;
}

export interface TeachingCoursewarePage {
  title: string;
  /** 投影到 PPTX 的可编辑正文；阅读预览也支持 Markdown 与公式。 */
  body: string;
  notes: string;
}

export interface TeachingCourseware {
  id: string;
  title: string;
  courseName: string;
  goals: string;
  outline: string;
  interactions: string;
  scriptNotes: string;
  slides?: TeachingCoursewarePage[];
  updatedAt: number;
}

export interface TeachingCase {
  id: string;
  title: string;
  courseName: string;
  knowledgeLabel: string;
  background: string;
  problem: string;
  analysis: string;
  discussion: string;
  desensitization: string;
  updatedAt: number;
}

export interface TeachingLabMaterial {
  id: string;
  title: string;
  courseName: string;
  objectives: string;
  principle: string;
  equipment: string;
  steps: string;
  safety: string;
  dataSheet: string;
  rubric: string;
  updatedAt: number;
}

/** 计算题替代旧版 code，兼容读取时可将 code 映射为 calc。 */
export type ExamQuestionType = "single" | "fill" | "short" | "calc";
export type ExamDifficulty = "easy" | "medium" | "hard";

export interface ExamQuestion {
  id: string;
  type: ExamQuestionType;
  knowledgeId: string;
  knowledgeLabel: string;
  difficulty: ExamDifficulty;
  stem: string;
  answer: string;
  score: number;
}

export interface ExamPaperDraft {
  id: string;
  title: string;
  questionIds: string[];
  updatedAt: number;
}

export interface HomeworkSubmission {
  id: string;
  alias: string;
  prompt: string;
  answer: string;
  suggestedScore: number | null;
  maxScore: number;
  feedback: string;
  updatedAt: number;
}

export interface KnowledgeStat {
  knowledgeId: string;
  label: string;
  avgScoreRate: number;
  belowSixtyRate: number;
  /** 再教学建议话术（演示种子预置）。 */
  reteachHint?: string;
}

export interface TeachingWorkspaceData {
  /** 演示种子版本；变更领域内容时递增以刷新本地缓存。 */
  seedVersion?: number;
  lessons: TeachingLessonPlan[];
  activeLessonId: string | null;
  coursewares: TeachingCourseware[];
  activeCoursewareId: string | null;
  cases: TeachingCase[];
  activeCaseId: string | null;
  labs: TeachingLabMaterial[];
  activeLabId: string | null;
  questions: ExamQuestion[];
  paper: ExamPaperDraft;
  /** 学情跳转组卷时使用的知识点筛选；空字符串表示不过滤。 */
  examKnowledgeFilter: string;
  submissions: HomeworkSubmission[];
  knowledgeStats: KnowledgeStat[];
}

export const TEACHING_STAGES: Array<{
  id: TeachingStageId;
  labelId: string;
  hintId: string;
}> = [
  { id: "preclass", labelId: "teaching.stage.preclass", hintId: "teaching.stage.preclass.hint" },
  { id: "postclass", labelId: "teaching.stage.postclass", hintId: "teaching.stage.postclass.hint" },
  { id: "practicum", labelId: "teaching.stage.practicum", hintId: "teaching.stage.practicum.hint" },
];

export const TEACHING_PANELS: Array<{
  id: TeachingPanelId;
  stage: Exclude<TeachingStageId, "home">;
  labelId: string;
  descriptionId: string;
  agentPromptId: string;
}> = [
  {
    id: "lesson-editor",
    stage: "preclass",
    labelId: "teaching.panel.lesson",
    descriptionId: "teaching.panel.lesson.desc",
    agentPromptId: "teaching.agentPrompt.lesson",
  },
  {
    id: "courseware-editor",
    stage: "preclass",
    labelId: "teaching.panel.courseware",
    descriptionId: "teaching.panel.courseware.desc",
    agentPromptId: "teaching.agentPrompt.courseware",
  },
  {
    id: "case-library",
    stage: "preclass",
    labelId: "teaching.panel.case",
    descriptionId: "teaching.panel.case.desc",
    agentPromptId: "teaching.agentPrompt.case",
  },
  {
    id: "exam-builder",
    stage: "postclass",
    labelId: "teaching.panel.exam",
    descriptionId: "teaching.panel.exam.desc",
    agentPromptId: "teaching.agentPrompt.exam",
  },
  {
    id: "review-desk",
    stage: "postclass",
    labelId: "teaching.panel.review",
    descriptionId: "teaching.panel.review.desc",
    agentPromptId: "teaching.agentPrompt.review",
  },
  {
    id: "analytics-board",
    stage: "postclass",
    labelId: "teaching.panel.analytics",
    descriptionId: "teaching.panel.analytics.desc",
    agentPromptId: "teaching.agentPrompt.analytics",
  },
  {
    id: "lab-editor",
    stage: "practicum",
    labelId: "teaching.panel.lab",
    descriptionId: "teaching.panel.lab.desc",
    agentPromptId: "teaching.agentPrompt.lab",
  },
];

/** @deprecated 实训已有独立子台；保留常量以免旧引用断裂。 */
export const TEACHING_PRACTICUM_CARD = {
  id: "lab-practicum" as const,
  stage: "practicum" as const,
  labelId: "teaching.panel.lab",
  descriptionId: "teaching.panel.lab.desc",
  agentPromptId: "teaching.agentPrompt.lab",
};

/** 子台 → 内置教学 skill（bundled-skills）。 */
export const TEACHING_PANEL_SKILLS: Record<TeachingPanelId, string> = {
  "lesson-editor": "lesson-plan",
  "courseware-editor": "courseware-outline",
  "case-library": "case-mining",
  "exam-builder": "exam-paper",
  "review-desk": "homework-review",
  "analytics-board": "learning-analytics",
  "lab-editor": "lab-practicum",
};

/** 子台对话 draft 推荐与 teachingDraftSuggestedPrompts.id 对齐。 */
export const TEACHING_PANEL_DRAFT_PROMPT_IDS: Record<TeachingPanelId, string> = {
  "lesson-editor": "teaching-draft-lesson-plan",
  "courseware-editor": "teaching-draft-courseware",
  "case-library": "teaching-draft-case",
  "exam-builder": "teaching-draft-exam",
  "review-desk": "teaching-draft-review",
  "analytics-board": "teaching-draft-analytics",
  "lab-editor": "teaching-draft-lab",
};

export function normalizeExamQuestionType(type: string): ExamQuestionType {
  if (type === "code") return "calc";
  if (type === "single" || type === "fill" || type === "short" || type === "calc") {
    return type;
  }
  return "short";
}
