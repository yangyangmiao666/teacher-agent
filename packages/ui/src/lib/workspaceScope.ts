import type { WorkspaceTabState } from "@/store/tabStore.js";
export function getWorkspaceScopeKey(
  workspace: Pick<WorkspaceTabState, "workspaceIdentity" | "workspacePath">,
): string {
  return workspace.workspaceIdentity?.trim() || workspace.workspacePath;
}
export function isWorkspaceScopeConnected(workspace: WorkspaceTabState): boolean {
  return !workspace.remoteTarget || Boolean(workspace.remoteSessionId);
}
