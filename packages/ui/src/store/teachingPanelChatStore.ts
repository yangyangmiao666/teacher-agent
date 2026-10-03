import { z } from "zod";
import { create } from "zustand";
import type { TeachingPanelId } from "@/teaching/teachingTypes.js";

function workspaceKey(workspacePath: string, workspaceIdentity?: string): string {
  return (workspaceIdentity?.trim() || workspacePath).trim() || "default";
}

function sessionsStorageKey(key: string): string {
  return `jzx-teaching-sessions:${key}`;
}

function loadSessions(key: string): Partial<Record<TeachingPanelId, string>> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(sessionsStorageKey(key));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<TeachingPanelId, string>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistSessions(key: string, sessions: Partial<Record<TeachingPanelId, string>>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(sessionsStorageKey(key), JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

export interface TeachingPanelWorkspace {
  workspacePath: string;
  workspaceIdentity?: string;
  remoteSessionId?: string | null;
}
function readBindings(): Record<string, TeachingPanelWorkspace> {
  try {
    const values = JSON.parse(localStorage.getItem("jzx-teaching-panel-workspaces") || "{}");
    return z
      .record(
        z.string(),
        z.object({
          workspacePath: z.string().min(1),
          workspaceIdentity: z.string().optional(),
          remoteSessionId: z.string().nullable().optional(),
        }),
      )
      .parse(values);
  } catch {
    return {};
  }
}
export const teachingPanelBindingKey = (base: TeachingPanelWorkspace, panel: TeachingPanelId) =>
  JSON.stringify([base.workspaceIdentity?.trim() || base.workspacePath, panel]);
interface TeachingPanelChatState {
  workspaceBindings: Record<string, TeachingPanelWorkspace>;
  setPanelWorkspace: (
    base: TeachingPanelWorkspace,
    panel: TeachingPanelId,
    scope: TeachingPanelWorkspace,
  ) => void;
  /** 各子台当前会话（持久化到 localStorage，刷新可恢复）。 */
  panelSessions: Record<string, Partial<Record<TeachingPanelId, string>>>;
  getPanelSession: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    panelId: TeachingPanelId,
  ) => string | null;
  setPanelSession: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    panelId: TeachingPanelId,
    sessionId: string | null,
  ) => void;
  pendingPrefill: {
    workspaceKey: string;
    panelId: TeachingPanelId;
    text: string;
    version: number;
  } | null;
  requestPanelPrefill: (
    workspacePath: string,
    workspaceIdentity: string | undefined,
    panelId: TeachingPanelId,
    text: string,
  ) => void;
  clearPendingPrefill: (version: number) => void;
}

export const useTeachingPanelChatStore = create<TeachingPanelChatState>((set, get) => ({
  workspaceBindings: readBindings(),
  setPanelWorkspace: (base, panel, scope) => {
    const key = teachingPanelBindingKey(base, panel);
    set((state) => {
      const workspaceBindings = { ...state.workspaceBindings, [key]: scope };
      try {
        localStorage.setItem("jzx-teaching-panel-workspaces", JSON.stringify(workspaceBindings));
      } catch {
        /* 配额失败不更改已有会话。 */
      }
      return { workspaceBindings };
    });
  },
  panelSessions: {},
  pendingPrefill: null,
  getPanelSession: (workspacePath, workspaceIdentity, panelId) => {
    const key = workspaceKey(workspacePath, workspaceIdentity);
    const cached = get().panelSessions[key];
    if (cached) return cached[panelId] ?? null;
    const loaded = loadSessions(key);
    if (Object.keys(loaded).length) {
      set((state) => ({
        panelSessions: { ...state.panelSessions, [key]: loaded },
      }));
    }
    return loaded[panelId] ?? null;
  },
  setPanelSession: (workspacePath, workspaceIdentity, panelId, sessionId) => {
    const key = workspaceKey(workspacePath, workspaceIdentity);
    set((state) => {
      const prev = state.panelSessions[key] ?? loadSessions(key);
      const nextForKey = { ...prev };
      if (sessionId) nextForKey[panelId] = sessionId;
      else delete nextForKey[panelId];
      persistSessions(key, nextForKey);
      return {
        panelSessions: { ...state.panelSessions, [key]: nextForKey },
      };
    });
  },
  requestPanelPrefill: (workspacePath, workspaceIdentity, panelId, text) => {
    const key = workspaceKey(workspacePath, workspaceIdentity);
    const trimmed = text.trim();
    if (!trimmed) return;
    set((state) => {
      const prev = state.panelSessions[key] ?? loadSessions(key);
      const nextForKey = { ...prev };
      delete nextForKey[panelId];
      persistSessions(key, nextForKey);
      return {
        panelSessions: { ...state.panelSessions, [key]: nextForKey },
        pendingPrefill: {
          workspaceKey: key,
          panelId,
          text: trimmed,
          version: (state.pendingPrefill?.version ?? 0) + 1,
        },
      };
    });
  },
  clearPendingPrefill: (version) => {
    set((state) => (state.pendingPrefill?.version === version ? { pendingPrefill: null } : state));
  },
}));
