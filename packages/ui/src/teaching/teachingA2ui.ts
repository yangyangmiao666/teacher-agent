import { A2uiMessageSchema } from "@a2ui/web_core/v0_9";
import { z } from "zod";
import {
  teachingSurfaceSchema,
  type TeachingSurface,
  type TeachingComponent,
} from "./teachingCanvasSchema.js";

import { safePath } from "./teachingDataPath.js";

export function resolveTeachingText(
  node: TeachingComponent,
  surface: TeachingSurface,
): Omit<TeachingComponent, "text"> & { text?: string } {
  if (typeof node.text !== "object" || !node.text) return { ...node, text: node.text };
  let value: unknown = surface.dataModel;
  for (const part of safePath(node.text.path))
    value =
      value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined;
  return {
    ...node,
    text: typeof value === "string" || typeof value === "number" ? String(value) : "",
  };
}
/** 官方消息校验 → 当前草稿的纯事务变换；最终组件树校验后才提交。 */
export function applyTeachingA2ui(
  value: unknown,
  current?: TeachingSurface | null,
): TeachingSurface {
  const messages = z.array(z.record(z.string(), z.unknown())).min(1).max(32).parse(value);
  let draft = current ? structuredClone(current) : null;
  for (const raw of messages) {
    // 兼容先前未带版本/catalogId 的教智星简化快照；显式错误值仍由官方 schema 拒绝。
    const normalized = {
      ...raw,
      version: raw.version ?? "v0.9",
      ...(raw.createSurface
        ? {
            createSurface: {
              catalogId: "jzx-teaching",
              ...z.record(z.string(), z.unknown()).parse(raw.createSurface),
            },
          }
        : {}),
    };
    const message = A2uiMessageSchema.parse(normalized);
    if ("createSurface" in message) {
      if (message.createSurface.catalogId !== "jzx-teaching")
        throw new Error("Unsupported teaching catalog");
      draft = {
        title: message.createSurface.surfaceId,
        surfaceId: message.createSurface.surfaceId,
        dataModel: {},
        components: [],
      };
      continue;
    }
    if (!draft?.surfaceId) throw new Error("Create surface before updates");
    if ("deleteSurface" in message) throw new Error("Use teacher canvas clear action");
    const update =
      "updateComponents" in message ? message.updateComponents : message.updateDataModel;
    if (update.surfaceId !== draft.surfaceId) throw new Error("Surface ID mismatch");
    if ("updateComponents" in message) {
      const nodes = new Map(draft.components.map((c) => [c.id, c]));
      const ids = new Set<string>();
      for (const component of message.updateComponents.components) {
        const id = z.string().min(1).max(80).parse(component.id);
        if (ids.has(id)) throw new Error("Duplicate update ID");
        ids.add(id);
        // 官方允许自定义目录 props；实际目录在事务末由严格 schema 校验。
        nodes.set(id, { ...component, id } as TeachingComponent);
      }
      draft.components = [...nodes.values()];
    } else {
      const parts = safePath(message.updateDataModel.path || "/");
      const json = JSON.stringify(message.updateDataModel.value);
      if (
        json === undefined ||
        json.length > 30000 ||
        /"(?:__proto__|constructor|prototype)"\s*:/u.test(json)
      )
        throw new Error("Invalid data model");
      const data: unknown = JSON.parse(json);
      if (!parts.length) draft.dataModel = z.record(z.string(), z.unknown()).parse(data);
      else {
        const model = draft.dataModel ?? {};
        let parent: Record<string, unknown> = model;
        for (const part of parts.slice(0, -1)) {
          const nested = parent[part];
          if (nested === undefined) parent[part] = {};
          else if (!nested || typeof nested !== "object" || Array.isArray(nested))
            throw new Error("Data path is not an object");
          parent = parent[part] as Record<string, unknown>;
        }
        parent[parts.at(-1)!] = data;
        draft.dataModel = model;
      }
    }
  }
  if (!draft) throw new Error("No surface");
  if (JSON.stringify(draft).length > 100000) throw new Error("Surface exceeds limit");
  return teachingSurfaceSchema.parse(draft);
}
