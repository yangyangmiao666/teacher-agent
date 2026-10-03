import type { WorkspacePurpose, JiaoZhiXingTaskMeta } from "@zcode/shared";

export type JiaoZhiXingTaskListKind = "pinned" | "archived" | "timeline" | "active";
export type JiaoZhiXingTaskListSortBy = "created" | "updated";

export interface JiaoZhiXingTaskListWorkspaceScope {
  workspacePath: string;
  workspaceIdentity?: string;
  workspacePurpose?: WorkspacePurpose;
}

export interface JiaoZhiXingTaskListQuery {
  kind: JiaoZhiXingTaskListKind;
  workspaceScopes: JiaoZhiXingTaskListWorkspaceScope[];
  sortBy: JiaoZhiXingTaskListSortBy;
  search?: string;
  limit?: number;
}

export type JiaoZhiXingTaskListItem = JiaoZhiXingTaskMeta & {
  searchSnippet?: string;
  searchSnippets?: string[];
};

export interface JiaoZhiXingTaskListResult {
  items: JiaoZhiXingTaskListItem[];
  total: number;
  hasMore: boolean;
}

export type JiaoZhiXingTaskGroupColor =
  | "gray"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple";

export interface JiaoZhiXingTaskGroup {
  id: string;
  title: string;
  color: JiaoZhiXingTaskGroupColor;
  createdAt: number;
  updatedAt: number;
}

export interface JiaoZhiXingGroupedTaskRef {
  workspacePath: string;
  workspaceIdentity?: string;
  taskId: string;
}

export type JiaoZhiXingGroupedTaskViewTopLevelNodeRef =
  | { type: "group"; groupId: string }
  | { type: "task"; task: JiaoZhiXingGroupedTaskRef };

export type JiaoZhiXingGroupedTaskViewNode =
  | {
      type: "group";
      group: JiaoZhiXingTaskGroup;
      tasks: JiaoZhiXingTaskListItem[];
      sortOrder?: number;
    }
  | {
      type: "task";
      task: JiaoZhiXingTaskListItem;
      sortOrder?: number;
    };

export interface JiaoZhiXingGroupedTaskView {
  nodes: JiaoZhiXingGroupedTaskViewNode[];
}

export interface JiaoZhiXingGroupedTaskViewQuery {
  workspaceScopes: JiaoZhiXingTaskListWorkspaceScope[];
  includeAllWorkspaces?: boolean;
}

// ── grouped 原始结构（不 join tasks 表）──
// grouped 视图的任务数据源迁到 sessions-index 后，服务端只提供分组结构
// （task_groups / task_group_members / task_group_view_node_orders），
// 由客户端与 sessions-index 会话做 join。

/** 组成员引用（不含任务 meta；task 内容由 sessions-index 提供）。 */
export interface JiaoZhiXingGroupedTaskViewStructureMember {
  groupId: string;
  /** 服务端口径 workspaceKey（resolveWorkspaceKey：identity ?? path），join 匹配键。 */
  workspaceKey: string;
  workspacePath: string;
  workspaceIdentity?: string;
  taskId: string;
  /** null = 尚未落 sort_order（新加入组）；客户端按 addedAt 降序补内存序。 */
  sortOrder: number | null;
  addedAt: number;
}

/** 顶层节点排序（task_group_view_node_orders，node_key 已解析为结构化引用）。 */
export type JiaoZhiXingGroupedTaskViewStructureTopOrder =
  | { type: "group"; groupId: string; sortOrder: number }
  | { type: "task"; workspaceKey: string; taskId: string; sortOrder: number };

export interface JiaoZhiXingGroupedTaskViewStructure {
  /** 已按 workspaceScopes 可见性过滤的 group（bootstrap workspace group 只在其 workspace 可见）。 */
  groups: JiaoZhiXingTaskGroup[];
  /** 全量组成员（含不可见 group 的成员——顶层排除规则需要全量判断）。 */
  members: JiaoZhiXingGroupedTaskViewStructureMember[];
  topLevelOrders: JiaoZhiXingGroupedTaskViewStructureTopOrder[];
}

export interface JiaoZhiXingGroupedTaskViewOrderInput {
  workspaceScopes: JiaoZhiXingTaskListWorkspaceScope[];
  topLevelNodes: JiaoZhiXingGroupedTaskViewTopLevelNodeRef[];
  groups: Array<{
    groupId: string;
    taskRefs: JiaoZhiXingGroupedTaskRef[];
  }>;
}

export interface JiaoZhiXingWorkspaceEventSubscriptionParams {
  workspacePath: string;
  workspaceIdentity?: string;
}
