import { replaceRemoteWorkspaceIdentityPath } from "@zcode/shared";
import { useServices } from "./useServices.js";
import { useSelectDirectory } from "./usePlatform.js";
import type { TeachingPanelWorkspace } from "@/store/teachingPanelChatStore.js";

export function useTeachingWorkspacePicker(scope: TeachingPanelWorkspace) {
  const services = useServices();
  const selectDirectory = useSelectDirectory();
  const resolve = async (path: string): Promise<TeachingPanelWorkspace> => {
    const workspacePath = await services.fileService.resolvePath({ path });
    const stat = await services.fileService.stat({ path: workspacePath });
    if (stat.type !== "directory") throw new Error("Please select a directory");
    return {
      workspacePath,
      ...(scope.remoteSessionId ? { remoteSessionId: scope.remoteSessionId } : {}),
      ...(scope.workspaceIdentity?.startsWith("remote:")
        ? {
            workspaceIdentity: replaceRemoteWorkspaceIdentityPath(
              scope.workspaceIdentity,
              workspacePath,
            ),
          }
        : workspacePath === scope.workspacePath && scope.workspaceIdentity
          ? { workspaceIdentity: scope.workspaceIdentity }
          : {}),
    };
  };
  return { services, resolve, selectDirectory };
}
