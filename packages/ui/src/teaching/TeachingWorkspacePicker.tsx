import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.js";
import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button.js";
import { DirectoryBrowser } from "@/DirectoryBrowser.js";
import { useTeachingWorkspacePicker } from "@/hooks/useTeachingWorkspacePicker.js";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import type { TeachingPanelWorkspace } from "@/store/teachingPanelChatStore.js";

export function TeachingWorkspacePicker({
  scope,
  isDesktop,
  onSelect,
}: {
  scope: TeachingPanelWorkspace;
  isDesktop: boolean;
  onSelect: (scope: TeachingPanelWorkspace) => void;
}) {
  const { locale } = useJiaoZhiXingIntl();
  const zh = locale.startsWith("zh");
  const { services, resolve, selectDirectory } = useTeachingWorkspacePicker(scope);
  const [browsing, setBrowsing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const apply = async (path: string) => {
    setBusy(true);
    setError("");
    try {
      onSelect(await resolve(path));
      setBrowsing(false);
    } catch {
      setError(
        zh
          ? "目录不可用，请选择可读取的工作区。"
          : "Directory unavailable. Choose an accessible workspace.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        className="w-full justify-start overflow-hidden"
        data-testid="teaching-workspace-picker"
        onClick={async () => {
          setError("");
          if (isDesktop && !scope.remoteSessionId) {
            const path = await selectDirectory();
            if (path) await apply(path);
          } else setBrowsing(true);
        }}
      >
        <FolderOpen className="size-3.5 shrink-0 text-brand" aria-hidden />
        <span className="shrink-0">{zh ? "工作区" : "Workspace"}</span>
        <span className="min-w-0 truncate font-mono text-ui-xs" title={scope.workspacePath}>
          {scope.workspacePath}
        </span>
      </Button>
      {error && (
        <p role="alert" className="text-ui-sm text-destructive">
          {error}
        </p>
      )}
      <Dialog open={browsing} onOpenChange={setBrowsing}>
        <DialogContent className="flex max-h-[80vh] flex-col overflow-auto">
          <DialogTitle>{zh ? "选择本页工作区" : "Select page workspace"}</DialogTitle>
          <p className="text-ui-sm text-foreground-subtle">
            {zh
              ? "选择智能体执行端目录。本页面的对话、画布与产物将一起切换。"
              : "Choose an Agent-host directory. This page's conversation, canvas and artifacts switch together."}
          </p>
          <DirectoryBrowser
            services={services}
            embedded
            showSelectionActions
            onSelect={(path) => void apply(path)}
            onCancel={() => setBrowsing(false)}
          />
          {error && (
            <p role="alert" className="text-ui-sm text-destructive">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
