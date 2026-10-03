import { ServiceChannels } from "@zcode/shared";
import type {
  TraceId,
  JiaoZhiXingAgentMcpServer,
  JiaoZhiXingDeliveryKind,
  JiaoZhiXingMessageWithParts,
  ModelSelection,
  JiaoZhiXingPermissionRequestParams,
  JiaoZhiXingUserInputRequestParams,
  JiaoZhiXingUserInputResponse,
  JiaoZhiXingSessionInfo,
  JiaoZhiXingSessionImportHistory,
  JiaoZhiXingSessionEvent,
  JiaoZhiXingSessionMode,
  JiaoZhiXingSessionPersistence,
  JiaoZhiXingSessionStateSnapshot,
  JiaoZhiXingStateUpdatedNotification,
  JiaoZhiXingWorkspacePresentation,
} from "@zcode/shared";
import { createServiceDescriptor } from "#src/descriptors.js";

export interface JiaoZhiXingSessionWorkspaceTarget {
  workspacePath: string;
  workspaceIdentity?: string;
  remoteSessionId?: string;
}

export type JiaoZhiXingSessionReadWorkspacePresentationParams = JiaoZhiXingSessionWorkspaceTarget;

export interface JiaoZhiXingTaskTarget extends JiaoZhiXingSessionWorkspaceTarget {
  sessionId: string;
}

export interface JiaoZhiXingSessionCreateParams extends JiaoZhiXingSessionWorkspaceTarget {
  /** 仅导入事务使用的预分配 ID；普通新会话继续由 Agent 分配。 */
  sessionId?: string;
  sessionTraceId?: TraceId;
  parentSessionId?: string;
  mode?: JiaoZhiXingSessionMode;
  model?: ModelSelection;
  persistence?: JiaoZhiXingSessionPersistence;
  thoughtLevel?: string;
  mcpServers?: JiaoZhiXingAgentMcpServer[];
  importedHistory?: JiaoZhiXingSessionImportHistory;
}

export interface JiaoZhiXingSessionResumeParams extends JiaoZhiXingTaskTarget {
  model?: ModelSelection;
  thoughtLevel?: string;
  mcpServers?: JiaoZhiXingAgentMcpServer[];
  /**
   * 默认广播 resume 得到的历史快照，并让 shadow 订阅请求初始 snapshot。
   * 续聊发送前的 runtime 预恢复会关闭它，避免旧终态快照覆盖本地已开始的新输入运行态。
   */
  broadcastSnapshot?: boolean;
}

export interface JiaoZhiXingSessionListParams extends JiaoZhiXingSessionWorkspaceTarget {
  includeArchived?: boolean;
  limit?: number;
}

export interface JiaoZhiXingSessionReadParams extends JiaoZhiXingTaskTarget {
  deliveryKind?: JiaoZhiXingDeliveryKind;
  messageLimit?: number;
  afterSeq?: number;
}

export interface JiaoZhiXingSessionMessagesParams extends JiaoZhiXingTaskTarget {
  afterMessageId?: string;
  limit?: number;
}

export interface JiaoZhiXingSessionEventsParams extends JiaoZhiXingTaskTarget {
  afterSeq?: number;
  limit?: number;
}

export interface JiaoZhiXingSessionSetModelParams extends JiaoZhiXingTaskTarget {
  model: ModelSelection;
  expectedRevision?: number;
  persistAsWorkspaceLastUsed?: boolean;
}

export interface JiaoZhiXingSessionSetThoughtLevelParams extends JiaoZhiXingTaskTarget {
  thoughtLevel?: string;
  expectedRevision?: number;
  persistAsWorkspaceLastUsed?: boolean;
}

export interface JiaoZhiXingSessionSetModeParams extends JiaoZhiXingTaskTarget {
  mode: JiaoZhiXingSessionMode;
  expectedRevision?: number;
}

export interface JiaoZhiXingSessionSubscribeParams extends JiaoZhiXingTaskTarget {
  deliveryKind: JiaoZhiXingDeliveryKind;
  afterSeq?: number;
  includeSnapshot?: boolean;
  eventCoalescing?: {
    mode: "background-summary";
    intervalMs?: number;
  };
}

export type JiaoZhiXingSessionServiceEvent =
  | { type: "session.event"; event: JiaoZhiXingSessionEvent }
  | { type: "state.updated"; notification: JiaoZhiXingStateUpdatedNotification }
  | { type: "permission.request"; request: JiaoZhiXingPermissionRequestParams }
  | { type: "userInput.request"; request: JiaoZhiXingUserInputRequestParams }
  | {
      type: "userInput.response";
      requestId: string;
      response: JiaoZhiXingUserInputResponse;
    }
  | { type: "snapshot"; snapshot: JiaoZhiXingSessionStateSnapshot };

export interface JiaoZhiXingSessionInitializeResult {
  available: boolean;
  workspaceKey: string;
  protocolName?: string;
  protocolVersion?: number;
  transportKind?: "stdio" | "websocket";
  reason?: string;
  reasonCode?: "provider_not_ready";
}

export interface JiaoZhiXingSessionWorkspaceRuntimeIdentity {
  generation: number;
  identity: string;
  processId?: number;
  workspaceKey: string;
}

export interface IJiaoZhiXingSessionService {
  initializeWorkspace(params: JiaoZhiXingSessionWorkspaceTarget): Promise<JiaoZhiXingSessionInitializeResult>;
  getWorkspaceRuntimeIdentity(
    params: JiaoZhiXingSessionWorkspaceTarget,
  ): Promise<JiaoZhiXingSessionWorkspaceRuntimeIdentity>;
  readWorkspacePresentation(
    params: JiaoZhiXingSessionReadWorkspacePresentationParams,
  ): Promise<JiaoZhiXingWorkspacePresentation>;
  createSession(params: JiaoZhiXingSessionCreateParams): Promise<JiaoZhiXingSessionStateSnapshot>;
  resumeSession(params: JiaoZhiXingSessionResumeParams): Promise<JiaoZhiXingSessionStateSnapshot>;
  listSessions(params: JiaoZhiXingSessionListParams): Promise<JiaoZhiXingSessionInfo[]>;
  readSession(params: JiaoZhiXingSessionReadParams): Promise<JiaoZhiXingSessionStateSnapshot>;
  readSessionMessages(params: JiaoZhiXingSessionMessagesParams): Promise<JiaoZhiXingMessageWithParts[]>;
  readSessionEvents(params: JiaoZhiXingSessionEventsParams): Promise<JiaoZhiXingSessionEvent[]>;
  promoteDeferredDraftSession(params: JiaoZhiXingTaskTarget): Promise<void>;
  closeSession(params: JiaoZhiXingTaskTarget): Promise<void>;
  closeDeferredDraftSession(params: JiaoZhiXingTaskTarget): Promise<boolean>;
  setModel(params: JiaoZhiXingSessionSetModelParams): Promise<JiaoZhiXingSessionStateSnapshot>;
  setThoughtLevel(params: JiaoZhiXingSessionSetThoughtLevelParams): Promise<JiaoZhiXingSessionStateSnapshot>;
  setMode(params: JiaoZhiXingSessionSetModeParams): Promise<JiaoZhiXingSessionStateSnapshot>;
  // renderer 订阅面走 agentService 的 conversation/sessions-index 帧通道。
}

export const IJiaoZhiXingSessionService = createServiceDescriptor<IJiaoZhiXingSessionService>(
  ServiceChannels.JiaoZhiXingSession,
);
