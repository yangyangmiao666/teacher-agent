import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";
import type { TeachingApplyCandidate } from "@/teaching/teachingApplyParse.js";
import type {
  ExamQuestion,
  HomeworkSubmission,
  KnowledgeStat,
  TeachingCase,
  TeachingCourseware,
  TeachingLabMaterial,
  TeachingLessonPlan,
  TeachingPanelId,
  TeachingWorkspaceData,
} from "@/teaching/teachingTypes.js";

export interface TeachingApplyResult {
  panelId: TeachingPanelId;
  fieldIds: string[];
  confidence: number;
  summary: string;
  itemId: string | null;
}

export interface TeachingUndoSnapshot {
  workspaceKey: string;
  panelId: TeachingPanelId;
  data: TeachingWorkspaceData;
  result: TeachingApplyResult;
}

function workspaceKey(workspacePath: string, workspaceIdentity?: string): string {
  return (workspaceIdentity?.trim() || workspacePath).trim() || "default";
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 将解析结果写入左侧教学草稿；返回可撤销快照。 */
export function applyTeachingCandidate(input: {
  workspacePath: string;
  workspaceIdentity?: string;
  candidate: TeachingApplyCandidate;
  /** 若候选面板与当前不一致，是否切换子台。默认 true。 */
  switchPanel?: boolean;
}): { result: TeachingApplyResult; undo: TeachingUndoSnapshot } | null {
  const { workspacePath, workspaceIdentity, candidate } = input;
  const switchPanel = input.switchPanel !== false;
  const store = useTeachingWorkbenchStore.getState();
  const key = workspaceKey(workspacePath, workspaceIdentity);
  const before = structuredClone(store.ensureWorkspace(workspacePath, workspaceIdentity));

  let itemId: string | null = null;
  let summary = "";

  if (candidate.kind === "lesson" && candidate.lesson) {
    const activeId = before.activeLessonId ?? before.lessons[0]?.id ?? null;
    if (activeId) {
      store.updateLesson(workspacePath, workspaceIdentity, activeId, candidate.lesson);
      itemId = activeId;
      summary = "已更新当前教案";
    } else {
      store.addLesson(workspacePath, workspaceIdentity);
      const after = store.getWorkspace(workspacePath, workspaceIdentity);
      const createdId = after.activeLessonId;
      if (createdId) {
        store.updateLesson(workspacePath, workspaceIdentity, createdId, candidate.lesson);
        itemId = createdId;
      }
      summary = "已新建并填入教案";
    }
  } else if (candidate.kind === "courseware" && candidate.courseware) {
    const activeId = before.activeCoursewareId ?? before.coursewares[0]?.id ?? null;
    if (activeId) {
      store.updateCourseware(workspacePath, workspaceIdentity, activeId, candidate.courseware);
      itemId = activeId;
      summary = "已更新当前课件";
    } else {
      store.addCourseware(workspacePath, workspaceIdentity);
      const after = store.getWorkspace(workspacePath, workspaceIdentity);
      const createdId = after.activeCoursewareId;
      if (createdId) {
        store.updateCourseware(workspacePath, workspaceIdentity, createdId, candidate.courseware);
        itemId = createdId;
      }
      summary = "已新建并填入课件";
    }
  } else if (candidate.kind === "case" && candidate.caseItem) {
    const activeId = before.activeCaseId ?? before.cases[0]?.id ?? null;
    if (activeId) {
      store.updateCase(workspacePath, workspaceIdentity, activeId, candidate.caseItem);
      itemId = activeId;
      summary = "已更新当前案例";
    } else {
      store.addCase(workspacePath, workspaceIdentity);
      const after = store.getWorkspace(workspacePath, workspaceIdentity);
      const createdId = after.activeCaseId;
      if (createdId) {
        store.updateCase(workspacePath, workspaceIdentity, createdId, candidate.caseItem);
        itemId = createdId;
      }
      summary = "已新建并填入案例";
    }
  } else if (candidate.kind === "lab" && candidate.lab) {
    const activeId = before.activeLabId ?? before.labs[0]?.id ?? null;
    if (activeId) {
      store.updateLab(workspacePath, workspaceIdentity, activeId, candidate.lab);
      itemId = activeId;
      summary = "已更新当前实训材料";
    } else {
      store.addLab(workspacePath, workspaceIdentity);
      const after = store.getWorkspace(workspacePath, workspaceIdentity);
      const createdId = after.activeLabId;
      if (createdId) {
        store.updateLab(workspacePath, workspaceIdentity, createdId, candidate.lab);
        itemId = createdId;
      }
      summary = "已新建并填入实训材料";
    }
  } else if (candidate.kind === "exam" && candidate.questions?.length) {
    const createdIds: string[] = [];
    for (const question of candidate.questions) {
      const id = question.id?.trim() || newId("q");
      const next: ExamQuestion = {
        id,
        type: question.type,
        knowledgeId: question.knowledgeId,
        knowledgeLabel: question.knowledgeLabel,
        difficulty: question.difficulty,
        stem: question.stem,
        answer: question.answer,
        score: question.score,
      };
      store.upsertQuestion(workspacePath, workspaceIdentity, next);
      createdIds.push(id);
    }
    // 一次性写入试卷勾选，避免 toggle 误取消。
    useTeachingWorkbenchStore.setState((state) => {
      const key = workspaceKey(workspacePath, workspaceIdentity);
      const current = state.workspaces[key] ?? before;
      const mergedIds = [...new Set([...current.paper.questionIds, ...createdIds])];
      const nextData: TeachingWorkspaceData = {
        ...current,
        paper: {
          ...current.paper,
          title: candidate.paperTitle?.trim() || current.paper.title,
          questionIds: mergedIds,
          updatedAt: Date.now(),
        },
      };
      try {
        localStorage.setItem(`jzx-teaching:${key}`, JSON.stringify(nextData));
      } catch {
        // ignore
      }
      return { workspaces: { ...state.workspaces, [key]: nextData } };
    });
    itemId = createdIds[0] ?? null;
    summary = `已写入 ${createdIds.length} 道题并加入试卷`;
  } else if (candidate.kind === "review" && candidate.review) {
    const hint = candidate.review.aliasHint?.trim();
    const target =
      (hint
        ? before.submissions.find((item) => item.alias.includes(hint) || hint.includes(item.alias))
        : null) ?? before.submissions[0];
    if (!target) return null;
    const patch: Partial<HomeworkSubmission> = {};
    if (candidate.review.suggestedScore != null)
      patch.suggestedScore = candidate.review.suggestedScore;
    if (candidate.review.maxScore != null) patch.maxScore = candidate.review.maxScore;
    if (candidate.review.feedback) patch.feedback = candidate.review.feedback;
    store.updateSubmission(workspacePath, workspaceIdentity, target.id, patch);
    itemId = target.id;
    summary = `已更新 ${target.alias} 的评阅建议`;
  } else if (candidate.kind === "analytics" && candidate.knowledgeStats?.length) {
    // 学情统计直接替换演示数据区（仍属 UI 草稿层）。
    useTeachingWorkbenchStore.setState((state) => {
      const current = state.workspaces[key] ?? before;
      const merged: KnowledgeStat[] = candidate.knowledgeStats!.map((stat) => ({ ...stat }));
      const next: TeachingWorkspaceData = {
        ...current,
        knowledgeStats: merged,
      };
      try {
        localStorage.setItem(`jzx-teaching:${key}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return { workspaces: { ...state.workspaces, [key]: next } };
    });
    itemId = candidate.knowledgeStats[0]?.knowledgeId ?? null;
    summary = `已更新 ${candidate.knowledgeStats.length} 个知识点学情`;
  } else {
    return null;
  }

  if (switchPanel) {
    store.setActivePanel(candidate.panelId);
  }

  const result: TeachingApplyResult = {
    panelId: candidate.panelId,
    fieldIds: candidate.fieldIds,
    confidence: candidate.confidence,
    summary,
    itemId,
  };
  return {
    result,
    undo: { workspaceKey: key, panelId: candidate.panelId, data: before, result },
  };
}

export function restoreTeachingUndo(undo: TeachingUndoSnapshot): void {
  useTeachingWorkbenchStore.setState((state) => {
    try {
      localStorage.setItem(`jzx-teaching:${undo.workspaceKey}`, JSON.stringify(undo.data));
    } catch {
      // ignore
    }
    return {
      activePanel: undo.panelId,
      workspaces: { ...state.workspaces, [undo.workspaceKey]: undo.data },
    };
  });
}

/** 供类型收窄 / 调试：当前激活条目摘要。 */
export function describeActiveTeachingItem(
  data: TeachingWorkspaceData,
  panelId: TeachingPanelId,
): { title: string; excerpt: string } | null {
  if (panelId === "lesson-editor") {
    const lesson =
      data.lessons.find((item) => item.id === data.activeLessonId) ?? data.lessons[0] ?? null;
    if (!lesson) return null;
    return { title: lesson.title, excerpt: lesson.objectives.slice(0, 120) };
  }
  if (panelId === "courseware-editor") {
    const item =
      data.coursewares.find((entry) => entry.id === data.activeCoursewareId) ??
      data.coursewares[0] ??
      null;
    if (!item) return null;
    return { title: item.title, excerpt: item.outline.slice(0, 120) };
  }
  if (panelId === "case-library") {
    const item =
      data.cases.find((entry) => entry.id === data.activeCaseId) ?? data.cases[0] ?? null;
    if (!item) return null;
    return { title: item.title, excerpt: item.problem.slice(0, 120) };
  }
  if (panelId === "lab-editor") {
    const item = data.labs.find((entry) => entry.id === data.activeLabId) ?? data.labs[0] ?? null;
    if (!item) return null;
    return { title: item.title, excerpt: item.objectives.slice(0, 120) };
  }
  if (panelId === "exam-builder") {
    return {
      title: data.paper.title,
      excerpt: `题库 ${data.questions.length} 题，已选 ${data.paper.questionIds.length} 题`,
    };
  }
  if (panelId === "review-desk") {
    const item = data.submissions[0];
    if (!item) return null;
    return { title: item.alias, excerpt: item.answer.slice(0, 120) };
  }
  if (panelId === "analytics-board") {
    const weak = [...data.knowledgeStats].sort((a, b) => a.avgScoreRate - b.avgScoreRate)[0];
    if (!weak) return null;
    return {
      title: "学情看板",
      excerpt: `最薄弱：${weak.label}（${weak.avgScoreRate}%）`,
    };
  }
  return null;
}

// silence unused type imports in some bundlers
export type TeachingApplyEntity =
  | TeachingLessonPlan
  | TeachingCourseware
  | TeachingCase
  | TeachingLabMaterial;
