import type { JiaoZhiXingSessionStateSnapshot } from "@zcode/shared";
import type {
  JiaoZhiXingSessionWorkspaceTarget,
  JiaoZhiXingTaskTarget,
} from "#src/zcode-session/zcodeSession.js";

function getWorkspaceKey(target: JiaoZhiXingSessionWorkspaceTarget): string {
  return target.workspaceIdentity?.trim() || target.workspacePath;
}

function getSessionScopedKey(target: JiaoZhiXingTaskTarget): string {
  return `${getWorkspaceKey(target)}\0${target.sessionId}`;
}

export function createJiaoZhiXingDeferredDraftRegistry() {
  const sessionKeys = new Set<string>();

  return {
    remember(params: JiaoZhiXingSessionWorkspaceTarget, snapshot: JiaoZhiXingSessionStateSnapshot): void {
      sessionKeys.add(
        getSessionScopedKey({
          workspacePath: snapshot.session.workspace.workspacePath,
          workspaceIdentity:
            snapshot.session.workspace.workspaceIdentity ?? params.workspaceIdentity,
          sessionId: snapshot.session.sessionId,
        }),
      );
    },

    has(target: JiaoZhiXingTaskTarget): boolean {
      return sessionKeys.has(getSessionScopedKey(target));
    },

    forget(target: JiaoZhiXingTaskTarget): void {
      sessionKeys.delete(getSessionScopedKey(target));
    },
  };
}
