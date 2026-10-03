import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { ChevronDown, UploadCloud } from "lucide-react";
import type { RemoteTarget } from "@zcode/shared";
import type { IMcpSyncService, ISkillSyncService, IJiaoZhiXingAgentService } from "@zcode/services";
import { Button } from "@/components/ui/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.js";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { RemoteMcpSyncDialog } from "@/settings/RemoteMcpSyncDialog.js";
import { RemoteSkillSyncDialog } from "@/settings/RemoteSkillSyncDialog.js";

type RemoteSyncClientMode = "desktop-continuous" | "web-remote-replayable";
const REMOTE_SYNC_PREFLIGHT_TIMEOUT_MS = 15_000;

class RemoteSyncPreflightTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Remote sync preflight timed out after ${timeoutMs}ms`);
    this.name = "RemoteSyncPreflightTimeoutError";
  }
}

export function isRemoteSyncPreflightTimeoutError(
  error: unknown,
): error is RemoteSyncPreflightTimeoutError {
  return error instanceof RemoteSyncPreflightTimeoutError;
}

export function shouldShowRemoteSyncActions(params: {
  remoteSessionId?: string | null;
  remoteTarget?: RemoteTarget | null;
  clientMode?: RemoteSyncClientMode;
  hasLocalSourceService?: boolean;
}): boolean {
  if (params.clientMode === "web-remote-replayable") {
    return false;
  }
  if (params.hasLocalSourceService === false) {
    return false;
  }
  return Boolean(
    params.remoteSessionId?.trim() &&
    (params.remoteTarget?.kind === "ssh" || params.remoteTarget?.kind === "wsl"),
  );
}

export function shouldStartRemoteSyncOperation(params: {
  inFlight: boolean;
  selectedCount: number;
}): boolean {
  return !params.inFlight && params.selectedCount > 0;
}

export function useRemoteSyncDialogIntent(params: { rpcReady: boolean; targetKey: string }): {
  open: boolean;
  setOpen: (open: boolean) => void;
} {
  const [openedTargetKey, setOpenedTargetKey] = useState<string | null>(null);
  const open =
    params.rpcReady && params.targetKey.length > 0 && openedTargetKey === params.targetKey;
  useEffect(() => {
    if (!params.rpcReady) {
      setOpenedTargetKey(null);
    }
  }, [params.rpcReady]);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      setOpenedTargetKey(
        nextOpen && params.rpcReady && params.targetKey.length > 0 ? params.targetKey : null,
      );
    },
    [params.rpcReady, params.targetKey],
  );

  return { open, setOpen };
}

export async function runRemoteSyncPreflightWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = REMOTE_SYNC_PREFLIGHT_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new RemoteSyncPreflightTimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(), timeout]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export function RemoteSyncMenuItems({
  canSyncSkills,
  canSyncMcp,
  onOpenSkillSync,
  onOpenMcpSync,
  stopMouseDownPropagation = false,
  mcpDisabled = false,
}: {
  canSyncSkills: boolean;
  canSyncMcp: boolean;
  onOpenSkillSync: () => void;
  onOpenMcpSync: () => void;
  stopMouseDownPropagation?: boolean;
  mcpDisabled?: boolean;
}) {
  const { intl } = useJiaoZhiXingIntl();
  const handleMouseDown = stopMouseDownPropagation
    ? (event: MouseEvent) => {
        event.stopPropagation();
      }
    : undefined;

  return (
    <>
      {canSyncSkills ? (
        <DropdownMenuItem onMouseDown={handleMouseDown} onSelect={onOpenSkillSync}>
          <UploadCloud className="size-3.5" />
          {intl.formatMessage({ id: "settings.skills.remoteSync.open" })}
        </DropdownMenuItem>
      ) : null}
      {canSyncMcp ? (
        <DropdownMenuItem
          disabled={mcpDisabled}
          onMouseDown={handleMouseDown}
          onSelect={onOpenMcpSync}
        >
          <UploadCloud className="size-3.5" />
          {intl.formatMessage({ id: "settings.mcp.remoteSync.open" })}
        </DropdownMenuItem>
      ) : null}
      {null}
    </>
  );
}

export function RemoteSyncDropdownButton({
  canSyncSkills,
  canSyncMcp,
  mcpDisabled = false,
  onOpenSkillSync,
  onOpenMcpSync,
}: {
  canSyncSkills: boolean;
  canSyncMcp: boolean;
  mcpDisabled?: boolean;
  onOpenSkillSync: () => void;
  onOpenMcpSync: () => void;
}) {
  const { intl } = useJiaoZhiXingIntl();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="secondary" size="sm" className="gap-1">
          <UploadCloud className="size-3.5" aria-hidden="true" />
          {intl.formatMessage({ id: "settings.remoteSync.open" })}
          <ChevronDown className="size-3.5 text-foreground-subtle" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <RemoteSyncMenuItems
          canSyncSkills={canSyncSkills}
          canSyncMcp={canSyncMcp}
          mcpDisabled={mcpDisabled}
          onOpenSkillSync={onOpenSkillSync}
          onOpenMcpSync={onOpenMcpSync}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RemoteSyncDialogs({
  canSyncSkills,
  canSyncMcp,
  skillOpen,
  mcpOpen,
  onSkillOpenChange,
  onMcpOpenChange,
  localSkillSyncService,
  remoteSkillSyncService,
  localMcpSyncService,
  remoteMcpSyncService,
  localJiaoZhiXingAgentService,
  remoteJiaoZhiXingAgentService,
  remoteTarget,
  skillWorkspacePath,
  mcpWorkspacePath,
  mcpLocalWorkspacePath,
  workspaceIdentity,
  onSkillsSynced,
  onMcpSynced,
}: {
  canSyncSkills: boolean;
  canSyncMcp: boolean;
  skillOpen: boolean;
  mcpOpen: boolean;
  onSkillOpenChange: (open: boolean) => void;
  onMcpOpenChange: (open: boolean) => void;
  localSkillSyncService?: ISkillSyncService | null;
  remoteSkillSyncService?: ISkillSyncService | null;
  localMcpSyncService?: IMcpSyncService | null;
  remoteMcpSyncService?: IMcpSyncService | null;
  localJiaoZhiXingAgentService?: IJiaoZhiXingAgentService | null;
  remoteJiaoZhiXingAgentService?: IJiaoZhiXingAgentService | null;
  remoteTarget?: RemoteTarget | null;
  skillWorkspacePath: string;
  mcpWorkspacePath: string;
  mcpLocalWorkspacePath?: string;
  workspaceIdentity?: string;
  onSkillsSynced: () => Promise<void> | void;
  onMcpSynced: () => Promise<void> | void;
}) {
  const skillDialogProps =
    canSyncSkills && skillOpen && remoteTarget && localSkillSyncService && remoteSkillSyncService
      ? {
          localSkillSyncService,
          remoteSkillSyncService,
          remoteTarget,
        }
      : null;
  const mcpDialogProps =
    canSyncMcp && mcpOpen && remoteTarget && localMcpSyncService && remoteMcpSyncService
      ? {
          localMcpSyncService,
          remoteMcpSyncService,
          remoteTarget,
        }
      : null;

  return (
    <>
      {skillDialogProps ? (
        <RemoteSkillSyncDialog
          open={skillOpen}
          onOpenChange={onSkillOpenChange}
          localSkillSyncService={skillDialogProps.localSkillSyncService}
          remoteSkillSyncService={skillDialogProps.remoteSkillSyncService}
          remoteTarget={skillDialogProps.remoteTarget}
          workspacePath={skillWorkspacePath}
          workspaceIdentity={workspaceIdentity}
          onSynced={onSkillsSynced}
        />
      ) : null}
      {mcpDialogProps ? (
        <RemoteMcpSyncDialog
          open={mcpOpen}
          onOpenChange={onMcpOpenChange}
          localMcpSyncService={mcpDialogProps.localMcpSyncService}
          remoteMcpSyncService={mcpDialogProps.remoteMcpSyncService}
          remoteTarget={mcpDialogProps.remoteTarget}
          workspacePath={mcpWorkspacePath}
          localWorkspacePath={mcpLocalWorkspacePath}
          onSynced={onMcpSynced}
        />
      ) : null}
      {null}
    </>
  );
}
