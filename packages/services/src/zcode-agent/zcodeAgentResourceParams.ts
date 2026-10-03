import type {
  JiaoZhiXingAgentMcpServer,
  JiaoZhiXingAutomationScheduleRule,
  JiaoZhiXingMcpListMode,
  ModelSelection,
} from "@zcode/shared";

export interface JiaoZhiXingAgentWorkspaceTarget {
  workspacePath: string;
  workspaceIdentity?: string;
  /** 远程 workspace 的运行时会话身份；只用于隔离/路由，不能替代 workspacePath。 */
  remoteSessionId?: string;
}

export interface JiaoZhiXingAgentListMcpServerStatusesParams extends JiaoZhiXingAgentWorkspaceTarget {
  mcpServers?: JiaoZhiXingAgentMcpServer[];
  mode?: JiaoZhiXingMcpListMode;
}

// Composer Skill catalog：与 Plugin 引用相同，以 sessionId 区分 workspace 当前目录和
// resident Session runtime 快照；不参与 Settings 管理目录。
export interface JiaoZhiXingAgentSkillReferenceCatalogParams extends JiaoZhiXingAgentWorkspaceTarget {
  sessionId?: string;
}

// ---- 定时任务(automation)管理参数 ----

export interface JiaoZhiXingAgentCreateAutomationParams extends JiaoZhiXingAgentWorkspaceTarget {
  title: string;
  cronExpr: string;
  relativeDelayMinutes?: number;
  prompt: string;
  modelSelection?: ModelSelection;
  mode?: string;
  recurring?: boolean;
  maxRuns?: number;
  endAt?: number;
  scheduleRule?: JiaoZhiXingAutomationScheduleRule;
}

export interface JiaoZhiXingAgentUpdateAutomationParams extends JiaoZhiXingAgentWorkspaceTarget {
  automationId: string;
  title?: string;
  cronExpr?: string;
  prompt?: string;
  modelSelection?: ModelSelection | null;
  mode?: string | null;
  recurring?: boolean;
  maxRuns?: number | null;
  endAt?: number | null;
  scheduleRule?: JiaoZhiXingAutomationScheduleRule | null;
  scheduleEditedByUser?: boolean;
}

export interface JiaoZhiXingAgentAutomationIdParams extends JiaoZhiXingAgentWorkspaceTarget {
  automationId: string;
}

export interface JiaoZhiXingAgentSetAutomationEnabledParams extends JiaoZhiXingAgentWorkspaceTarget {
  automationId: string;
  enabled: boolean;
}

export interface JiaoZhiXingAgentDeleteAutomationRunParams extends JiaoZhiXingAgentWorkspaceTarget {
  runId: string;
}
