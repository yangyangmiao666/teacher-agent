/**
 * JiaoZhiXing Agent Slash Commands 便捷 hook
 *
 * 返回当前 workspace 下 Agent 广播的可用 slash commands 列表。
 */
import { useJiaoZhiXingSessionStore, selectWorkspaceJiaoZhiXingState } from "../store/zcodeSessionStore.js";

export function useSlashCommands(workspacePath: string, workspaceIdentity?: string) {
  return useJiaoZhiXingSessionStore(
    (state) => selectWorkspaceJiaoZhiXingState(state, workspacePath, workspaceIdentity).slashCommands,
  );
}
