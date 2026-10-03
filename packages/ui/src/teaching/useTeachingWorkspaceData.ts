import { useEffect, useMemo } from "react";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";
import type { TeachingWorkspaceData } from "@/teaching/teachingTypes.js";

function resolveWorkspaceKey(workspacePath: string, workspaceIdentity?: string): string {
  return (workspaceIdentity?.trim() || workspacePath).trim() || "default";
}

/** 订阅当前工作区教学数据；首次挂载时 ensure 并hydrate localStorage。 */
export function useTeachingWorkspaceData(
  workspacePath: string,
  workspaceIdentity?: string,
): TeachingWorkspaceData | null {
  const key = useMemo(
    () => resolveWorkspaceKey(workspacePath, workspaceIdentity),
    [workspaceIdentity, workspacePath],
  );
  const ensureWorkspace = useTeachingWorkbenchStore((s) => s.ensureWorkspace);
  const data = useTeachingWorkbenchStore((s) => s.workspaces[key] ?? null);

  useEffect(() => {
    ensureWorkspace(workspacePath, workspaceIdentity);
  }, [ensureWorkspace, workspaceIdentity, workspacePath]);

  return data;
}
