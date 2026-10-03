import { useCallback, useEffect, useRef, useState } from "react";
import type { FileBinaryPreview } from "@zcode/shared";
import { useServices } from "./useServices.js";
import { readTeachingArtifactBytes } from "./teachingArtifactCache.js";
import { teachingCanvasKey, useTeachingCanvasStore } from "@/store/teachingCanvasStore.js";
import {
  resolveTeachingArtifactPath,
  type TeachingArtifact,
} from "@/teaching/teachingArtifacts.js";
import { decodeBase64ToArrayBuffer } from "@/lib/officeFilePreview.js";
import type { TeachingPanelId } from "@/teaching/teachingTypes.js";

export function useTeachingArtifacts(
  panel: TeachingPanelId,
  workspacePath: string,
  identity?: string,
) {
  const { fileService } = useServices();
  const key = teachingCanvasKey(workspacePath, identity, panel);
  const request = useRef(0);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    const version = ++request.current;
    setLoading(true);
    try {
      const queue = [{ path: workspacePath.replace(/[\\/]$/, "") + "/outputs", depth: 0 }];
      const artifacts: TeachingArtifact[] = [];
      for (let index = 0; index < queue.length && index < 30 && artifacts.length < 100; index++) {
        const directory = queue[index]!;
        let entries;
        try {
          entries = await fileService.readdir({ path: directory.path });
        } catch {
          continue;
        }
        if (version !== request.current) return;
        for (const entry of entries.slice(0, 200)) {
          if (entry.type === "directory" && directory.depth < 3)
            queue.push({ path: entry.path, depth: directory.depth + 1 });
          else if (entry.type === "file") {
            const path = resolveTeachingArtifactPath(workspacePath, entry.path);
            if (path)
              artifacts.push({
                id: path,
                path,
                name: entry.name,
                source: "workspace",
                createdAt: Date.now(),
              });
          }
        }
      }
      if (version === request.current)
        useTeachingCanvasStore.getState().addArtifacts(key, artifacts);
    } finally {
      if (version === request.current) setLoading(false);
    }
  }, [fileService, key, workspacePath]);
  useEffect(() => {
    return () => {
      request.current++;
    };
  }, [key]);
  return { refresh, loading };
}

export function useTeachingArtifactBytes(
  key: string,
  artifact: TeachingArtifact | undefined,
  workspacePath: string,
) {
  const { fileService } = useServices();
  const token = `${key}:${artifact?.id ?? ""}:${artifact?.createdAt ?? 0}`;
  const [state, setState] = useState<{
    token: string;
    data: ArrayBuffer | null;
    preview: FileBinaryPreview | null;
    error: boolean;
  }>({ token: "", data: null, preview: null, error: false });
  useEffect(() => {
    let active = true;
    setState({ token, data: null, preview: null, error: false });
    if (artifact)
      void (async () => {
        try {
          let preview: FileBinaryPreview | null = null;
          let data: ArrayBuffer;
          if (artifact.source === "local") data = await readTeachingArtifactBytes(artifact.id);
          else {
            const path = resolveTeachingArtifactPath(workspacePath, artifact.path ?? "");
            if (!path) throw new Error("Artifact outside workspace");
            preview = await fileService.readBinaryPreview({
              path,
              maxBytes: 20 * 1024 * 1024,
            });
            data = decodeBase64ToArrayBuffer(preview.dataBase64);
          }
          if (data.byteLength > 20 * 1024 * 1024) throw new Error("Artifact exceeds 20MiB");
          if (active) setState({ token, data, preview, error: false });
        } catch {
          if (active) setState({ token, data: null, preview: null, error: true });
        }
      })();
    return () => {
      active = false;
    };
  }, [artifact?.id, artifact?.path, artifact?.source, fileService, token, workspacePath]);
  return state.token === token ? state : { data: null, preview: null, error: false };
}
