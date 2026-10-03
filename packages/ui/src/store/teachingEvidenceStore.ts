import { create } from "zustand";
import type { TeachingPanelId } from "@/teaching/teachingTypes.js";
import { TEACHING_PANEL_SKILLS } from "@/teaching/teachingTypes.js";

export type TeachingEvidenceKind =
  | "apply"
  | "loop-reteach"
  | "loop-exam"
  | "demo-step"
  | "export"
  | "review-batch";

export interface TeachingEvidenceEvent {
  id: string;
  at: number;
  kind: TeachingEvidenceKind;
  workspaceKey: string;
  panelId?: TeachingPanelId;
  skill?: string;
  summary: string;
  fields?: string[];
  sourceExcerpt?: string;
  knowledgeLabel?: string;
}

interface TeachingEvidenceState {
  eventsByWorkspace: Record<string, TeachingEvidenceEvent[]>;
  record: (event: Omit<TeachingEvidenceEvent, "id" | "at"> & { at?: number }) => TeachingEvidenceEvent;
  list: (workspaceKey: string) => TeachingEvidenceEvent[];
  clear: (workspaceKey: string) => void;
  exportMarkdown: (workspaceKey: string, locale: string) => string;
}

function storageKey(workspaceKey: string): string {
  return `jzx-evidence:${workspaceKey}`;
}

function load(workspaceKey: string): TeachingEvidenceEvent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(workspaceKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TeachingEvidenceEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(workspaceKey: string, events: TeachingEvidenceEvent[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(workspaceKey), JSON.stringify(events.slice(-200)));
  } catch {
    // ignore
  }
}

function newId(): string {
  return `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function teachingWorkspaceKey(workspacePath: string, workspaceIdentity?: string): string {
  return (workspaceIdentity?.trim() || workspacePath).trim() || "default";
}

export const useTeachingEvidenceStore = create<TeachingEvidenceState>((set, get) => ({
  eventsByWorkspace: {},
  record: (input) => {
    const event: TeachingEvidenceEvent = {
      id: newId(),
      at: input.at ?? Date.now(),
      kind: input.kind,
      workspaceKey: input.workspaceKey,
      summary: input.summary,
      ...(input.panelId ? { panelId: input.panelId } : {}),
      ...(input.skill
        ? { skill: input.skill }
        : input.panelId
          ? { skill: TEACHING_PANEL_SKILLS[input.panelId] }
          : {}),
      ...(input.fields?.length ? { fields: input.fields } : {}),
      ...(input.sourceExcerpt ? { sourceExcerpt: input.sourceExcerpt.slice(0, 480) } : {}),
      ...(input.knowledgeLabel ? { knowledgeLabel: input.knowledgeLabel } : {}),
    };
    set((state) => {
      const prev = state.eventsByWorkspace[input.workspaceKey] ?? load(input.workspaceKey);
      const next = [...prev, event].slice(-200);
      persist(input.workspaceKey, next);
      return {
        eventsByWorkspace: { ...state.eventsByWorkspace, [input.workspaceKey]: next },
      };
    });
    return event;
  },
  list: (workspaceKey) => {
    const cached = get().eventsByWorkspace[workspaceKey];
    // 空数组也算已灌入。若只在 loaded.length > 0 时写入，选择器会一直落到不稳定的新 []。
    if (cached) return cached;
    const loaded = load(workspaceKey);
    set((state) => {
      if (state.eventsByWorkspace[workspaceKey]) return state;
      return {
        eventsByWorkspace: { ...state.eventsByWorkspace, [workspaceKey]: loaded },
      };
    });
    return get().eventsByWorkspace[workspaceKey] ?? loaded;
  },
  clear: (workspaceKey) => {
    persist(workspaceKey, []);
    set((state) => ({
      eventsByWorkspace: { ...state.eventsByWorkspace, [workspaceKey]: [] },
    }));
  },
  exportMarkdown: (workspaceKey, locale) => {
    const isZh = locale.startsWith("zh");
    const events = get().list(workspaceKey);
    const title = isZh ? "# 教智星建设佐证时间线" : "# JiaoZhiXing evidence timeline";
    const intro = isZh
      ? "本文件由教学工作台自动生成，记录「智能体产出 → 应用到编辑器 / 学情闭环 / 申报演示」等过程性证据，可供申报材料引用。数据均为演示工作区脱敏内容。"
      : "Auto-generated process evidence from the teaching workbench (apply / closed loop / demo). Demo data is desensitized.";
    const lines = events
      .slice()
      .reverse()
      .map((event, index) => {
        const time = new Date(event.at).toLocaleString(isZh ? "zh-CN" : "en-US");
        const skill = event.skill ? ` · $${event.skill}` : "";
        const panel = event.panelId ? ` · ${event.panelId}` : "";
        const fields = event.fields?.length
          ? `\n  - ${isZh ? "字段" : "fields"}: ${event.fields.join(", ")}`
          : "";
        const knowledge = event.knowledgeLabel
          ? `\n  - ${isZh ? "知识点" : "knowledge"}: ${event.knowledgeLabel}`
          : "";
        const excerpt = event.sourceExcerpt
          ? `\n  - ${isZh ? "来源摘录" : "excerpt"}:\n\n\`\`\`\n${event.sourceExcerpt}\n\`\`\``
          : "";
        return `## ${index + 1}. [${event.kind}] ${event.summary}\n- ${time}${panel}${skill}${fields}${knowledge}${excerpt}`;
      });
    return `${title}\n\n${intro}\n\n${lines.join("\n\n") || (isZh ? "_暂无记录_" : "_No events yet_")}\n`;
  },
}));
