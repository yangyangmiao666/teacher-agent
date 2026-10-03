import { useState } from "react";
import type { RemoteTarget } from "@zcode/shared";
import type { WorkspaceTabState } from "@/store/tabStore.js";
import type { CreateTaskRequest } from "@/app-shell/types.js";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Input } from "@/components/ui/input.js";
import { SegmentPill } from "@/settings/SegmentPill.js";
import { SkillsSection } from "@/settings/SkillsSection.js";
import { McpSettingsSection } from "@/settings/McpSettingsSection.js";

// 技能和 MCP 使用各自的服务；筛选只属于当前设置页，不写入远端事实。
export function SettingsResourcesSection(props: {
  kind: "skill" | "mcp";
  workspacePath?: string | null;
  workspaceIdentity?: string;
  remoteSessionId?: string;
  remoteTarget?: RemoteTarget;
  localWorkspacePath?: string;
  workspaceTabs: WorkspaceTabState[];
  onCreateTask?: (request?: CreateTaskRequest) => void;
}) {
  const { intl } = useJiaoZhiXingIntl();
  const [scopeFilter, setScopeFilter] = useState<"user" | "workspace">("user");
  const [searchQuery, setSearchQuery] = useState("");
  const scopeKey =
    scopeFilter === "user" ? "user" : props.workspaceIdentity?.trim() || props.workspacePath || "";
  const shared = {
    workspacePath: props.workspacePath,
    workspaceIdentity: props.workspaceIdentity,
    remoteSessionId: props.remoteSessionId,
    remoteTarget: props.remoteTarget,
    scopeFilter,
    searchQuery,
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["user", "workspace"] as const).map((scope) => (
          <SegmentPill
            key={scope}
            label={intl.formatMessage({ id: `settings.scope.${scope}` })}
            active={scopeFilter === scope}
            onClick={() => setScopeFilter(scope)}
          />
        ))}
        <Input
          className="ml-auto max-w-xs"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label={intl.formatMessage({ id: "common.search" })}
          placeholder={intl.formatMessage({ id: "common.search" })}
        />
      </div>
      {props.kind === "skill" ? (
        <SkillsSection {...shared} onCreateTask={props.onCreateTask} />
      ) : (
        <McpSettingsSection
          {...shared}
          localWorkspacePath={props.localWorkspacePath}
          parentScopeKey={scopeKey}
          workspaceTabs={props.workspaceTabs}
        />
      )}
    </div>
  );
}
