/* oxlint-disable eslint(max-lines) -- 教学工作台领域 mutations 集中在此，拆散会让 workspace 分区与持久化边界跨文件跳转。 */
import { create } from "zustand";
import { createSeedTeachingData, TEACHING_SEED_VERSION } from "@/teaching/teachingSeed.js";
import {
  normalizeExamQuestionType,
  type ExamQuestion,
  type HomeworkSubmission,
  type TeachingCase,
  type TeachingCourseware,
  type TeachingLabMaterial,
  type TeachingLessonPlan,
  type TeachingPanelId,
  type TeachingWorkspaceData,
} from "@/teaching/teachingTypes.js";

function workspaceKey(workspacePath: string, workspaceIdentity?: string): string {
  return (workspaceIdentity?.trim() || workspacePath).trim() || "default";
}

function storageKey(key: string): string {
  return `jzx-teaching:${key}`;
}

function normalizeWorkspaceData(data: TeachingWorkspaceData): TeachingWorkspaceData {
  return {
    ...data,
    coursewares: data.coursewares ?? [],
    activeCoursewareId: data.activeCoursewareId ?? data.coursewares?.[0]?.id ?? null,
    cases: data.cases ?? [],
    activeCaseId: data.activeCaseId ?? data.cases?.[0]?.id ?? null,
    labs: data.labs ?? [],
    activeLabId: data.activeLabId ?? data.labs?.[0]?.id ?? null,
    examKnowledgeFilter: data.examKnowledgeFilter ?? "",
    questions: (data.questions ?? []).map((question) => ({
      ...question,
      type: normalizeExamQuestionType(question.type),
    })),
  };
}

function loadWorkspace(key: string): TeachingWorkspaceData {
  if (typeof localStorage === "undefined") {
    return createSeedTeachingData();
  }
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return createSeedTeachingData();
    const parsed = JSON.parse(raw) as TeachingWorkspaceData;
    if (!parsed?.lessons || !parsed?.questions) return createSeedTeachingData();
    // 领域样例扩展时刷新演示种子。
    if (parsed.seedVersion !== TEACHING_SEED_VERSION) {
      const next = createSeedTeachingData();
      persist(key, next);
      return next;
    }
    return normalizeWorkspaceData(parsed);
  } catch {
    return createSeedTeachingData();
  }
}

function persist(key: string, data: TeachingWorkspaceData): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(data));
  } catch {
    // ignore quota errors in demo UI
  }
}

interface TeachingWorkbenchStoreState {
  activePanel: TeachingPanelId;
  workspaces: Record<string, TeachingWorkspaceData>;
  setActivePanel: (panel: TeachingPanelId) => void;
  ensureWorkspace: (workspacePath: string, workspaceIdentity?: string) => TeachingWorkspaceData;
  getWorkspace: (workspacePath: string, workspaceIdentity?: string) => TeachingWorkspaceData;
  updateLesson: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    lessonId: string,
    patch: Partial<TeachingLessonPlan>,
  ) => void;
  setActiveLesson: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    lessonId: string,
  ) => void;
  addLesson: (workspacePath: string, workspaceIdentity?: string) => void;
  updateCourseware: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    coursewareId: string,
    patch: Partial<TeachingCourseware>,
  ) => void;
  setActiveCourseware: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    coursewareId: string,
  ) => void;
  addCourseware: (workspacePath: string, workspaceIdentity?: string) => void;
  updateCase: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    caseId: string,
    patch: Partial<TeachingCase>,
  ) => void;
  setActiveCase: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    caseId: string,
  ) => void;
  addCase: (workspacePath: string, workspaceIdentity?: string) => void;
  updateLab: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    labId: string,
    patch: Partial<TeachingLabMaterial>,
  ) => void;
  setActiveLab: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    labId: string,
  ) => void;
  addLab: (workspacePath: string, workspaceIdentity?: string) => void;
  upsertQuestion: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    question: ExamQuestion,
  ) => void;
  removeQuestion: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    questionId: string,
  ) => void;
  setPaperTitle: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    title: string,
  ) => void;
  togglePaperQuestion: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    questionId: string,
  ) => void;
  setExamKnowledgeFilter: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    knowledgeId: string,
  ) => void;
  openExamForKnowledge: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    knowledgeId: string,
  ) => void;
  updateSubmission: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    submissionId: string,
    patch: Partial<HomeworkSubmission>,
  ) => void;
  resetWorkspace: (workspacePath: string, workspaceIdentity?: string) => void;
}

function mutateWorkspace(
  set: (fn: (state: TeachingWorkbenchStoreState) => Partial<TeachingWorkbenchStoreState>) => void,
  get: () => TeachingWorkbenchStoreState,
  workspacePath: string,
  workspaceIdentity: string | undefined,
  updater: (data: TeachingWorkspaceData) => TeachingWorkspaceData,
): void {
  const key = workspaceKey(workspacePath, workspaceIdentity);
  const current = get().ensureWorkspace(workspacePath, workspaceIdentity);
  const next = updater(current);
  persist(key, next);
  set((state) => ({
    workspaces: { ...state.workspaces, [key]: next },
  }));
}

export const useTeachingWorkbenchStore = create<TeachingWorkbenchStoreState>((set, get) => ({
  activePanel: "lesson-editor",
  workspaces: {},
  setActivePanel: (panel) => set({ activePanel: panel }),
  ensureWorkspace: (workspacePath, workspaceIdentity) => {
    const key = workspaceKey(workspacePath, workspaceIdentity);
    const existing = get().workspaces[key];
    if (existing) return existing;
    const loaded = loadWorkspace(key);
    set((state) => ({
      workspaces: { ...state.workspaces, [key]: loaded },
    }));
    return loaded;
  },
  getWorkspace: (workspacePath, workspaceIdentity) => {
    const key = workspaceKey(workspacePath, workspaceIdentity);
    return get().workspaces[key] ?? createSeedTeachingData();
  },
  updateLesson: (workspacePath, workspaceIdentity, lessonId, patch) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      lessons: data.lessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, ...patch, updatedAt: Date.now() } : lesson,
      ),
    }));
  },
  setActiveLesson: (workspacePath, workspaceIdentity, lessonId) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      activeLessonId: lessonId,
    }));
  },
  addLesson: (workspacePath, workspaceIdentity) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => {
      const lesson: TeachingLessonPlan = {
        id: `lesson-${Math.random().toString(36).slice(2, 10)}`,
        title: "未命名教案",
        courseName: "材料加工冶金与传输原理",
        hours: 2,
        audience: "",
        objectives: "",
        keyPoints: "",
        difficulties: "",
        process: "",
        ideologyNotes: "",
        homework: "",
        updatedAt: Date.now(),
      };
      return {
        ...data,
        lessons: [lesson, ...data.lessons],
        activeLessonId: lesson.id,
      };
    });
  },
  updateCourseware: (workspacePath, workspaceIdentity, coursewareId, patch) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      coursewares: data.coursewares.map((item) =>
        item.id === coursewareId ? { ...item, ...patch, updatedAt: Date.now() } : item,
      ),
    }));
  },
  setActiveCourseware: (workspacePath, workspaceIdentity, coursewareId) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      activeCoursewareId: coursewareId,
    }));
  },
  addCourseware: (workspacePath, workspaceIdentity) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => {
      const item: TeachingCourseware = {
        id: `cw-${Math.random().toString(36).slice(2, 10)}`,
        title: "未命名课件提纲",
        courseName: "材料加工冶金与传输原理",
        goals: "",
        outline: "",
        interactions: "",
        scriptNotes: "",
        updatedAt: Date.now(),
      };
      return {
        ...data,
        coursewares: [item, ...data.coursewares],
        activeCoursewareId: item.id,
      };
    });
  },
  updateCase: (workspacePath, workspaceIdentity, caseId, patch) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      cases: data.cases.map((item) =>
        item.id === caseId ? { ...item, ...patch, updatedAt: Date.now() } : item,
      ),
    }));
  },
  setActiveCase: (workspacePath, workspaceIdentity, caseId) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      activeCaseId: caseId,
    }));
  },
  addCase: (workspacePath, workspaceIdentity) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => {
      const item: TeachingCase = {
        id: `case-${Math.random().toString(36).slice(2, 10)}`,
        title: "未命名案例",
        courseName: "材料加工冶金与传输原理",
        knowledgeLabel: "",
        background: "",
        problem: "",
        analysis: "",
        discussion: "",
        desensitization: "企业名与人员已脱敏；数据使用区间或相对比较。",
        updatedAt: Date.now(),
      };
      return {
        ...data,
        cases: [item, ...data.cases],
        activeCaseId: item.id,
      };
    });
  },
  updateLab: (workspacePath, workspaceIdentity, labId, patch) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      labs: data.labs.map((item) =>
        item.id === labId ? { ...item, ...patch, updatedAt: Date.now() } : item,
      ),
    }));
  },
  setActiveLab: (workspacePath, workspaceIdentity, labId) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      activeLabId: labId,
    }));
  },
  addLab: (workspacePath, workspaceIdentity) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => {
      const item: TeachingLabMaterial = {
        id: `lab-${Math.random().toString(36).slice(2, 10)}`,
        title: "未命名实训指导书",
        courseName: "材料加工冶金与传输原理",
        objectives: "",
        principle: "",
        equipment: "",
        steps: "",
        safety: "",
        dataSheet: "",
        rubric: "",
        updatedAt: Date.now(),
      };
      return {
        ...data,
        labs: [item, ...data.labs],
        activeLabId: item.id,
      };
    });
  },
  upsertQuestion: (workspacePath, workspaceIdentity, question) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => {
      const normalized = {
        ...question,
        type: normalizeExamQuestionType(question.type),
      };
      const exists = data.questions.some((item) => item.id === normalized.id);
      return {
        ...data,
        questions: exists
          ? data.questions.map((item) => (item.id === normalized.id ? normalized : item))
          : [...data.questions, normalized],
        paper: { ...data.paper, updatedAt: Date.now() },
      };
    });
  },
  removeQuestion: (workspacePath, workspaceIdentity, questionId) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      questions: data.questions.filter((item) => item.id !== questionId),
      paper: {
        ...data.paper,
        questionIds: data.paper.questionIds.filter((id) => id !== questionId),
        updatedAt: Date.now(),
      },
    }));
  },
  setPaperTitle: (workspacePath, workspaceIdentity, title) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      paper: { ...data.paper, title, updatedAt: Date.now() },
    }));
  },
  togglePaperQuestion: (workspacePath, workspaceIdentity, questionId) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => {
      const selected = data.paper.questionIds.includes(questionId);
      return {
        ...data,
        paper: {
          ...data.paper,
          questionIds: selected
            ? data.paper.questionIds.filter((id) => id !== questionId)
            : [...data.paper.questionIds, questionId],
          updatedAt: Date.now(),
        },
      };
    });
  },
  setExamKnowledgeFilter: (workspacePath, workspaceIdentity, knowledgeId) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      examKnowledgeFilter: knowledgeId,
    }));
  },
  openExamForKnowledge: (workspacePath, workspaceIdentity, knowledgeId) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => {
      const relatedIds = data.questions
        .filter((question) => question.knowledgeId === knowledgeId)
        .map((question) => question.id);
      const mergedIds = [...new Set([...data.paper.questionIds, ...relatedIds])];
      return {
        ...data,
        examKnowledgeFilter: knowledgeId,
        paper: {
          ...data.paper,
          questionIds: mergedIds,
          updatedAt: Date.now(),
        },
      };
    });
    set({ activePanel: "exam-builder" });
  },
  updateSubmission: (workspacePath, workspaceIdentity, submissionId, patch) => {
    mutateWorkspace(set, get, workspacePath, workspaceIdentity, (data) => ({
      ...data,
      submissions: data.submissions.map((item) =>
        item.id === submissionId ? { ...item, ...patch, updatedAt: Date.now() } : item,
      ),
    }));
  },
  resetWorkspace: (workspacePath, workspaceIdentity) => {
    const key = workspaceKey(workspacePath, workspaceIdentity);
    const next = createSeedTeachingData();
    persist(key, next);
    set((state) => ({
      workspaces: { ...state.workspaces, [key]: next },
    }));
  },
}));
