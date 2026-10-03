import type { ISkillsService } from "@zcode/services";
import {
  normalizeAgentProviderToJiaoZhiXingAgent,
  ZCODE_AGENT_PROVIDER,
  type JiaoZhiXingProvider,
} from "@zcode/shared";
import { useSkillStore } from "@/store/skillStore.js";

export async function refreshSharedSkillStoreForWorkspace(params: {
  workspacePath: string | null | undefined;
  workspaceIdentity?: string | null;
  skillsService: ISkillsService;
  provider?: JiaoZhiXingProvider;
}): Promise<void> {
  const workspacePath = params.workspacePath;
  if (!workspacePath) {
    return;
  }
  const skillStore = useSkillStore.getState();
  const normalizedWorkspaceIdentity = params.workspaceIdentity?.trim() || null;
  const normalizedProvider = normalizeAgentProviderToJiaoZhiXingAgent(
    params.provider ?? ZCODE_AGENT_PROVIDER,
  );
  const refreshes: Promise<void>[] = [];

  if (
    skillStore.workspacePath === workspacePath &&
    skillStore.workspaceIdentity === normalizedWorkspaceIdentity &&
    skillStore.loadedWorkspacePath === workspacePath &&
    skillStore.loadedWorkspaceIdentity === normalizedWorkspaceIdentity &&
    normalizeAgentProviderToJiaoZhiXingAgent(skillStore.provider) === normalizedProvider &&
    skillStore.loadedProvider === normalizedProvider
  ) {
    refreshes.push(
      skillStore.refresh(params.skillsService, normalizedWorkspaceIdentity ?? undefined),
    );
  }

  await Promise.all(refreshes);
}
