import { parseTeachingArtifacts } from "./teachingArtifacts.js";
import { useTeachingArtifacts } from "@/hooks/useTeachingArtifacts.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Sparkles, Undo2 } from "lucide-react";
import type { ConversationRow } from "@zcode/shared/zcode-protocol-v4";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { toast } from "@/components/ui/toast.js";
import { useTeachingBridgeStore } from "@/store/teachingBridgeStore.js";
import { teachingWorkspaceKey, useTeachingEvidenceStore } from "@/store/teachingEvidenceStore.js";
import { applyTeachingCandidate, restoreTeachingUndo } from "@/teaching/teachingApplyActions.js";
import { parseTeachingApplyCandidate } from "@/teaching/teachingApplyParse.js";
import type { TeachingPanelId } from "@/teaching/teachingTypes.js";
import { useV4Conversation } from "@/v4/V4ConversationContext.js";
import { useConversationProjection } from "@/v4/useConversationProjection.js";
import type { SessionLease } from "@/v4/sessionDataLayer.js";

import { teachingCanvasKey, useTeachingCanvasStore } from "@/store/teachingCanvasStore.js";

const AUTO_APPLY_CONFIDENCE = 0.72;

function extractLatestAssistantText(rows: readonly ConversationRow[]): {
  rowId: number;
  turnId: string;
  text: string;
  complete: boolean;
} | null {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (!row || row.kind !== "assistantText") continue;
    const text = row.text?.trim() ?? "";
    if (!text) continue;
    return {
      rowId: row.rowId,
      turnId: row.turnId,
      text,
      complete: row.state === "complete",
    };
  }
  return null;
}

export function TeachingApplyDock({
  panelId,
  sessionId,
  workspacePath,
  workspaceIdentity,
}: {
  panelId: TeachingPanelId;
  sessionId: string | null;
  workspacePath: string;
  workspaceIdentity?: string;
}) {
  const { refresh: refreshArtifacts } = useTeachingArtifacts(
    panelId,
    workspacePath,
    workspaceIdentity,
  );
  const { intl } = useJiaoZhiXingIntl();
  const { layer } = useV4Conversation();
  const [lease, setLease] = useState<SessionLease | null>(null);
  const projection = useConversationProjection(lease);
  const recentApply = useTeachingBridgeStore((s) => s.lastApply);
  const lastApply =
    recentApply?.panelId === panelId &&
    useTeachingBridgeStore.getState().undoStack.at(-1)?.workspaceKey ===
      teachingWorkspaceKey(workspacePath, workspaceIdentity)
      ? recentApply
      : null;
  const pushApply = useTeachingBridgeStore((s) => s.pushApply);
  const popUndo = useTeachingBridgeStore((s) => s.popUndo);
  const appliedTurnKeys = useTeachingBridgeStore((s) => s.appliedTurnKeys);
  const markAppliedTurn = useTeachingBridgeStore((s) => s.markAppliedTurn);
  const recordEvidence = useTeachingEvidenceStore((s) => s.record);
  const handledReplyRef = useRef<string | null>(null);
  const autoAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLease(null);
      return;
    }
    const next = layer.acquire(sessionId);
    setLease(next);
    return () => next.release();
  }, [layer, sessionId]);

  const latest = useMemo(() => {
    const rows = projection.snapshot?.rows.window ?? [];
    return extractLatestAssistantText(rows);
  }, [projection.snapshot?.rows.window]);

  useEffect(() => {
    // 旧 lease 的 projection 在会话切换首帧仍可能存在，必须先验证来源。
    if (!sessionId || lease?.sessionId !== sessionId || !latest?.complete) return;
    const eventId = `${sessionId}:${latest.rowId}`;
    if (handledReplyRef.current === eventId) return;
    handledReplyRef.current = eventId;
    const key = teachingCanvasKey(workspacePath, workspaceIdentity, panelId);
    const store = useTeachingCanvasStore.getState();
    store.ensure(key);
    store.receive(key, `${sessionId}:${latest.rowId}`, latest.text);
    const artifacts = parseTeachingArtifacts(latest.text, workspacePath);
    if (artifacts.length) store.addArtifacts(key, artifacts, true);
    void refreshArtifacts();
  }, [
    latest,
    lease?.sessionId,
    sessionId,
    panelId,
    workspaceIdentity,
    workspacePath,
    refreshArtifacts,
  ]);

  const candidate = useMemo(() => {
    if (!latest?.text || !sessionId || lease?.sessionId !== sessionId) return null;
    return parseTeachingApplyCandidate(latest.text, panelId);
  }, [latest?.text, panelId, sessionId, lease?.sessionId]);

  const turnKey =
    latest && candidate ? `${sessionId ?? "draft"}:${latest.turnId}:${candidate.kind}` : null;

  const applyCandidate = (
    next: NonNullable<typeof candidate>,
    key: string,
    reason: "manual" | "auto",
  ) => {
    const applied = applyTeachingCandidate({
      workspacePath,
      workspaceIdentity,
      candidate: next,
      switchPanel: next.panelId !== panelId,
    });
    if (!applied) {
      toast(intl.formatMessage({ id: "teaching.apply.failed" }));
      return;
    }
    pushApply(applied.undo);
    markAppliedTurn(key);
    recordEvidence({
      workspaceKey: teachingWorkspaceKey(workspacePath, workspaceIdentity),
      kind: "apply",
      panelId: next.panelId,
      summary: applied.result.summary,
      fields: applied.result.fieldIds,
      sourceExcerpt: latest?.text,
    });
    toast(
      intl.formatMessage(
        { id: reason === "auto" ? "teaching.apply.autoSuccess" : "teaching.apply.success" },
        { summary: applied.result.summary, count: applied.result.fieldIds.length },
      ),
    );
  };

  // 高置信完成态自动应用一次。
  useEffect(() => {
    if (!latest?.complete || !candidate || !turnKey) return;
    if (appliedTurnKeys[turnKey] || autoAppliedRef.current === turnKey) return;
    if (candidate.confidence < AUTO_APPLY_CONFIDENCE) return;
    if (candidate.panelId !== panelId) return;
    autoAppliedRef.current = turnKey;
    applyCandidate(candidate, turnKey, "auto");
  }, [
    appliedTurnKeys,
    candidate,
    latest?.complete,
    markAppliedTurn,
    panelId,
    pushApply,
    turnKey,
    workspaceIdentity,
    workspacePath,
    intl,
  ]);

  const handleUndo = () => {
    const undo = popUndo(teachingWorkspaceKey(workspacePath, workspaceIdentity), panelId);
    if (!undo) return;
    restoreTeachingUndo(undo);
    toast(intl.formatMessage({ id: "teaching.apply.undone" }));
  };

  if (!sessionId) return null;

  const showDock = Boolean(candidate && latest && (!turnKey || !appliedTurnKeys[turnKey ?? ""]));

  if (!showDock && !lastApply) return null;

  return (
    <div
      className="jzx-apply-dock flex shrink-0 flex-col gap-2 border-b border-border bg-card/95 px-2 py-2"
      data-testid="teaching-apply-dock"
    >
      {lastApply ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-brand/30 bg-card/95 px-3 py-2 shadow-sm">
          <div className="min-w-0 flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <div className="min-w-0">
              <div className="truncate text-ui-sm font-medium text-foreground">
                {lastApply.summary}
              </div>
              <div className="truncate text-ui-xs text-foreground-subtlest">
                {intl.formatMessage(
                  { id: "teaching.apply.fieldsHint" },
                  { count: lastApply.fieldIds.length },
                )}
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={handleUndo}>
            <Undo2 className="size-3.5" aria-hidden />
            {intl.formatMessage({ id: "teaching.apply.undo" })}
          </Button>
        </div>
      ) : null}

      {showDock && candidate ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-popover/95 px-3 py-2 shadow-sm">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-ui-sm font-medium">
              <Sparkles className="size-3.5 text-brand" aria-hidden />
              {intl.formatMessage({ id: "teaching.apply.readyTitle" })}
            </div>
            <div className="truncate text-ui-xs text-foreground-subtle">
              {intl.formatMessage(
                { id: "teaching.apply.readyHint" },
                {
                  fields: candidate.fieldIds.slice(0, 4).join(", "),
                  confidence: Math.round(candidate.confidence * 100),
                  source: candidate.source === "json-fence" ? "JSON" : "Markdown",
                },
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => turnKey && candidate && applyCandidate(candidate, turnKey, "manual")}
          >
            {intl.formatMessage({ id: "teaching.apply.action" })}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
