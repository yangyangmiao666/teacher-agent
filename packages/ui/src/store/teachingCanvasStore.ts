import { teachingResponseDocument } from "@/teaching/teachingResponseDocument.js";
import type { TeachingArtifact } from "@/teaching/teachingArtifacts.js";
import { create } from "zustand";
import { z } from "zod";
import type { TeachingPanelId } from "@/teaching/teachingTypes.js";
import {
  parseTeachingSurface,
  teachingSurfaceSchema,
  type TeachingSurface,
} from "@/teaching/teachingCanvasProtocol.js";

export const teachingCanvasKey = (
  path: string,
  identity: string | undefined,
  panel: TeachingPanelId,
) => JSON.stringify([identity?.trim() || path, panel]);
interface CanvasDraft {
  document: string;
  previousDocument: string;
  artifacts: TeachingArtifact[];
  selectedArtifactId: string | null;
  surface: TeachingSurface | null;
  previous: TeachingSurface | null;
  canUndo: boolean;
  consumed: string[];
  values: Record<string, string>;
  error: boolean;
}
const empty = (): CanvasDraft => ({
  previousDocument: "",
  document: "",
  artifacts: [],
  selectedArtifactId: null,
  surface: null,
  previous: null,
  canUndo: false,
  consumed: [],
  values: {},
  error: false,
});
function load(key: string): CanvasDraft {
  try {
    const value = JSON.parse(
      localStorage.getItem(`jzx-canvas:${key}`) || "null",
    ) as CanvasDraft | null;
    if (!value) return empty();
    return {
      previousDocument: typeof value.previousDocument === "string" ? value.previousDocument : "",
      document: typeof value.document === "string" ? value.document.slice(0, 100000) : "",
      artifacts: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            path: z.string().optional(),
            source: z.enum(["workspace", "local"]),
            createdAt: z.number(),
          }),
        )
        .max(100)
        .parse(value.artifacts ?? []),
      selectedArtifactId: value.selectedArtifactId ?? null,
      surface: value.surface ? teachingSurfaceSchema.parse(value.surface) : null,
      previous: value.previous ? teachingSurfaceSchema.parse(value.previous) : null,
      canUndo: Boolean(value.canUndo),
      consumed: Array.isArray(value.consumed)
        ? value.consumed.filter((x) => typeof x === "string").slice(-100)
        : [],
      values: z.record(z.string(), z.string().max(4000)).parse(value.values || {}),
      error: false,
    };
  } catch {
    return empty();
  }
}
function persist(key: string, draft: CanvasDraft) {
  try {
    localStorage.setItem(`jzx-canvas:${key}`, JSON.stringify(draft));
  } catch {
    /* 本地草稿配额不足不阻断会话。 */
  }
}
interface CanvasState {
  drafts: Record<string, CanvasDraft>;
  ensure: (key: string) => void;
  receive: (key: string, eventId: string, text: string) => void;
  undo: (key: string) => void;
  clear: (key: string) => void;
  addArtifacts: (key: string, artifacts: TeachingArtifact[], select?: boolean) => void;
  selectArtifact: (key: string, id: string | null) => void;
  setValue: (key: string, id: string, value: string) => void;
}
export const useTeachingCanvasStore = create<CanvasState>((set, get) => {
  const commit = (key: string, draft: CanvasDraft) => {
    persist(key, draft);
    set((s) => ({ drafts: { ...s.drafts, [key]: draft } }));
  };
  return {
    drafts: {},
    ensure: (key) => {
      if (!get().drafts[key]) set((s) => ({ drafts: { ...s.drafts, [key]: load(key) } }));
    },
    receive: (key, eventId, text) => {
      const old = get().drafts[key] ?? load(key);
      if (old.consumed.includes(eventId)) return;
      const consumed = [...old.consumed, eventId].slice(-100);
      try {
        const surface = parseTeachingSurface(text, old.surface);
        if (!surface) return;
        commit(key, {
          ...old,
          document: /```(?:jzx-ui|a2ui)/i.test(text)
            ? teachingResponseDocument(text) || old.document
            : "",
          surface,
          previous: old.surface,
          previousDocument: old.document,
          canUndo: true,
          consumed,
          values: {},
          error: false,
        });
      } catch {
        commit(key, { ...old, consumed, error: true });
      }
    },
    undo: (key) => {
      const old = get().drafts[key];
      if (old)
        commit(key, {
          ...old,
          surface: old.previous,
          document: old.previousDocument,
          previousDocument: "",
          previous: null,
          canUndo: false,
          values: {},
          error: false,
        });
    },
    clear: (key) => {
      const old = get().drafts[key];
      if (old)
        commit(key, {
          ...old,
          previous: old.surface,
          canUndo: true,
          surface: null,
          document: "",
          previousDocument: old.document,
          values: {},
          error: false,
        });
    },
    addArtifacts: (key, artifacts, select = false) => {
      const old = get().drafts[key] ?? load(key);
      const map = new Map(old.artifacts.map((item) => [item.id, item]));
      for (const item of artifacts) map.set(item.id, item);
      commit(key, {
        ...old,
        artifacts: [...map.values()].slice(-100),
        selectedArtifactId: select
          ? (artifacts[0]?.id ?? old.selectedArtifactId)
          : old.selectedArtifactId,
      });
    },
    selectArtifact: (key, id) => {
      const old = get().drafts[key] ?? load(key);
      commit(key, { ...old, selectedArtifactId: id });
    },
    setValue: (key, id, value) => {
      const old = get().drafts[key];
      if (old) commit(key, { ...old, values: { ...old.values, [id]: value.slice(0, 4000) } });
    },
  };
});
