import type { WorkspaceTabState } from "@/store/tabStore.js";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { getWorkspaceScopeKey } from "@/lib/workspaceScope.js";
export function WorkspaceScopeMenu({
  selectedScopeKey,
  workspaceTabs,
  onScopeKeyChange,
  disabled,
  align: _align,
}: {
  selectedScopeKey: string;
  workspaceTabs: WorkspaceTabState[];
  onScopeKeyChange: (key: string) => void;
  disabled?: boolean;
  align?: "start" | "end";
}) {
  const { intl } = useJiaoZhiXingIntl();
  return (
    <select
      className="max-w-full rounded-lg border border-border bg-background px-3 py-2 text-ui-base"
      aria-label={intl.formatMessage({ id: "settings.scope.label" })}
      value={selectedScopeKey}
      disabled={disabled}
      onChange={(event) => onScopeKeyChange(event.target.value)}
    >
      <option value="user">{intl.formatMessage({ id: "settings.scope.user" })}</option>
      {workspaceTabs.map((tab) => (
        <option key={getWorkspaceScopeKey(tab)} value={getWorkspaceScopeKey(tab)}>
          {tab.workspacePath.split(/[\\/]/).filter(Boolean).at(-1) || tab.workspacePath}
        </option>
      ))}
    </select>
  );
}
