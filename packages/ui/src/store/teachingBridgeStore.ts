import { create } from "zustand";
import type { TeachingApplyResult, TeachingUndoSnapshot } from "@/teaching/teachingApplyActions.js";
import type { TeachingPanelId } from "@/teaching/teachingTypes.js";

interface TeachingBridgeState {
  /** 是否在提问时自动附带左侧上下文。 */
  includeContext: boolean;
  setIncludeContext: (value: boolean) => void;
  /** 最近一次应用到左侧的结果（用于状态条）。 */
  lastApply: TeachingApplyResult | null;
  /** 已应用过的 assistant turn，避免重复自动应用。 */
  appliedTurnKeys: Record<string, true>;
  markAppliedTurn: (key: string) => void;
  undoStack: TeachingUndoSnapshot[];
  pushApply: (undo: TeachingUndoSnapshot) => void;
  popUndo: (workspaceKey?: string, panelId?: TeachingPanelId) => TeachingUndoSnapshot | null;
  clearLastApply: () => void;
  /** 左侧字段高亮。 */
  focus: { panelId: TeachingPanelId; fieldIds: string[]; token: number } | null;
  setFocus: (panelId: TeachingPanelId, fieldIds: string[]) => void;
  clearFocus: () => void;
}

export const useTeachingBridgeStore = create<TeachingBridgeState>((set, get) => ({
  includeContext: true,
  setIncludeContext: (value) => set({ includeContext: value }),
  lastApply: null,
  appliedTurnKeys: {},
  markAppliedTurn: (key) =>
    set((state) => ({ appliedTurnKeys: { ...state.appliedTurnKeys, [key]: true } })),
  undoStack: [],
  pushApply: (undo) =>
    set((state) => ({
      lastApply: undo.result,
      undoStack: [...state.undoStack.slice(-9), undo],
      focus: {
        panelId: undo.panelId,
        fieldIds: undo.result.fieldIds,
        token: Date.now(),
      },
    })),
  popUndo: (workspaceKey, panelId) => {
    const stack = get().undoStack;
    if (stack.length === 0) return null;
    const index = stack.findLastIndex(
      (item) =>
        (!workspaceKey || item.workspaceKey === workspaceKey) &&
        (!panelId || item.panelId === panelId),
    );
    if (index < 0) return null;
    const next = stack[index]!;
    set({
      undoStack: stack.filter((_, i) => i !== index),
      lastApply: null,
      focus: null,
    });
    return next;
  },
  clearLastApply: () => set({ lastApply: null }),
  focus: null,
  setFocus: (panelId, fieldIds) => set({ focus: { panelId, fieldIds, token: Date.now() } }),
  clearFocus: () => set({ focus: null }),
}));
