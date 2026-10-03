import { TeachingWorkspacePicker } from "./TeachingWorkspacePicker.js";
import type { TeachingPanelWorkspace } from "@/store/teachingPanelChatStore.js";
import { useCallback, useEffect, useMemo } from "react";
import { Link2, Link2Off, MessageSquarePlus, Sparkles } from "lucide-react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { useJiaoZhiXingSessionStore } from "@/store/zcodeSessionStore.js";
import { useTeachingPanelChatStore } from "@/store/teachingPanelChatStore.js";
import { useTeachingBridgeStore } from "@/store/teachingBridgeStore.js";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";
import {
  TEACHING_PANEL_DRAFT_PROMPT_IDS,
  TEACHING_PANEL_SKILLS,
  TEACHING_PANELS,
  type TeachingPanelId,
} from "@/teaching/teachingTypes.js";
import { teachingDraftSuggestedPrompts } from "@/teaching/teachingDraftPrompts.js";
import { TeachingApplyDock } from "@/teaching/TeachingApplyDock.js";
import {
  buildTeachingContextAppendix,
  wrapPromptWithTeachingContext,
} from "@/teaching/teachingContext.js";
import { describeActiveTeachingItem } from "@/teaching/teachingApplyActions.js";
import { SessionPane } from "@/v4/SessionPane.js";
import { V4PaneConversationProvider } from "@/v4/V4ConversationContext.js";
import type { PaneWorkspaceScope } from "@/v4/paneLayoutStore.js";
import { resolveDraftSuggestedPromptText } from "@/v4/draftSuggestedPromptItems.js";
import { buildSkillMentionMarkdown } from "@/mentions/mentionMarkdown.js";

import {
  TEACHING_CANVAS_INSTRUCTIONS,
  TEACHING_ARTIFACT_INSTRUCTIONS,
  TEACHING_VISUAL_DESIGN_INSTRUCTIONS,
} from "./teachingCanvasProtocol.js";
import { teachingCanvasKey, useTeachingCanvasStore } from "@/store/teachingCanvasStore.js";

export function teachingPaneId(panelId: TeachingPanelId): string {
  return `teaching-${panelId}`;
}

function buildPanelPrefillPrompt(panelId: TeachingPanelId, promptBody: string): string {
  const skill = TEACHING_PANEL_SKILLS[panelId];
  const mention = buildSkillMentionMarkdown(skill);
  const body = promptBody.trim();
  if (!body) return `${mention} `;
  if (body.includes(`$${skill}`) || body.startsWith(mention)) return body;
  return `${mention} ${body}`;
}

export function TeachingChatPanel({
  panelId,
  workspacePath,
  workspaceIdentity,
  remoteSessionId,
  isDesktop,
  onWorkspaceSelect,
}: {
  panelId: TeachingPanelId;
  workspacePath: string;
  workspaceIdentity?: string;
  remoteSessionId?: string | null;
  isDesktop?: boolean;
  onWorkspaceSelect: (scope: TeachingPanelWorkspace) => void;
}) {
  const { intl, locale } = useJiaoZhiXingIntl();
  const sessionId = useTeachingPanelChatStore((s) =>
    s.getPanelSession(workspacePath, workspaceIdentity, panelId),
  );
  const setPanelSession = useTeachingPanelChatStore((s) => s.setPanelSession);
  const pendingPrefill = useTeachingPanelChatStore((s) => s.pendingPrefill);
  const clearPendingPrefill = useTeachingPanelChatStore((s) => s.clearPendingPrefill);
  const requestPanelPrefill = useTeachingPanelChatStore((s) => s.requestPanelPrefill);
  const requestComposerTextInsert = useJiaoZhiXingSessionStore((s) => s.requestComposerTextInsert);
  const includeContext = useTeachingBridgeStore((s) => s.includeContext);
  const setIncludeContext = useTeachingBridgeStore((s) => s.setIncludeContext);
  const clearFocus = useTeachingBridgeStore((s) => s.clearFocus);
  const focus = useTeachingBridgeStore((s) => s.focus);
  const ensureWorkspace = useTeachingWorkbenchStore((s) => s.ensureWorkspace);
  const workspaceData = useTeachingWorkbenchStore((s) =>
    s.getWorkspace(workspacePath, workspaceIdentity),
  );

  useEffect(() => {
    ensureWorkspace(workspacePath, workspaceIdentity);
  }, [ensureWorkspace, workspaceIdentity, workspacePath]);

  useEffect(() => {
    if (!focus) return;
    const timer = window.setTimeout(() => clearFocus(), 2200);
    return () => window.clearTimeout(timer);
  }, [clearFocus, focus?.token]);

  const scope = useMemo<PaneWorkspaceScope>(
    () => ({
      workspacePath,
      ...(workspaceIdentity?.trim() ? { workspaceIdentity } : {}),
      ...(remoteSessionId ? { remoteSessionId } : {}),
    }),
    [remoteSessionId, workspaceIdentity, workspacePath],
  );

  const panelMeta = TEACHING_PANELS.find((item) => item.id === panelId);
  const paneId = teachingPaneId(panelId);
  const activeSummary = useMemo(
    () => describeActiveTeachingItem(workspaceData, panelId),
    [panelId, workspaceData],
  );

  const starterItem = useMemo(() => {
    const id = TEACHING_PANEL_DRAFT_PROMPT_IDS[panelId];
    return teachingDraftSuggestedPrompts.find((item) => item.id === id) ?? null;
  }, [panelId]);

  const handleSessionCreated = useCallback(
    (nextSessionId: string) => {
      setPanelSession(workspacePath, workspaceIdentity, panelId, nextSessionId);
    },
    [panelId, setPanelSession, workspaceIdentity, workspacePath],
  );

  const handleSessionDeleted = useCallback(() => {
    setPanelSession(workspacePath, workspaceIdentity, panelId, null);
  }, [panelId, setPanelSession, workspaceIdentity, workspacePath]);

  const handleNewChat = useCallback(() => {
    setPanelSession(workspacePath, workspaceIdentity, panelId, null);
  }, [panelId, setPanelSession, workspaceIdentity, workspacePath]);

  const enqueuePrefill = useCallback(
    (promptBody: string) => {
      // 预填只展示教师请求；技能、课程草稿和画布规则在发送边界统一附加。
      requestPanelPrefill(workspacePath, workspaceIdentity, panelId, promptBody.trim());
    },
    [panelId, requestPanelPrefill, workspaceIdentity, workspacePath],
  );

  const handleStarterClick = useCallback(() => {
    if (!starterItem) return;
    const prompt = resolveDraftSuggestedPromptText(starterItem.prompt, locale);
    enqueuePrefill(prompt);
  }, [enqueuePrefill, locale, starterItem]);

  // 问智能体 / 推荐 chips：等本子台回到草稿后再写入 composer。
  useEffect(() => {
    if (!pendingPrefill) return;
    const workspaceKey = (workspaceIdentity?.trim() || workspacePath).trim() || "default";
    if (pendingPrefill.workspaceKey !== workspaceKey || pendingPrefill.panelId !== panelId) {
      return;
    }
    if (sessionId) return;
    requestComposerTextInsert(workspacePath, pendingPrefill.text, workspaceIdentity);
    clearPendingPrefill(pendingPrefill.version);
  }, [
    clearPendingPrefill,
    panelId,
    pendingPrefill,
    requestComposerTextInsert,
    sessionId,
    workspaceIdentity,
    workspacePath,
  ]);

  return (
    <section
      className="jzx-chat-panel relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card"
      data-testid={`teaching-chat-panel-${panelId}`}
      data-teaching-chat-panel={panelId}
    >
      <header className="flex shrink-0 flex-col gap-2 border-b border-border px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-ui-sm font-medium text-foreground">
              <Sparkles className="size-3.5 shrink-0 text-brand" aria-hidden />
              <span className="truncate">
                {intl.formatMessage({ id: "teaching.chat.title" })}
                {panelMeta ? (
                  <span className="text-foreground-subtle">
                    {" · "}
                    {intl.formatMessage({ id: panelMeta.labelId })}
                  </span>
                ) : null}
              </span>
            </div>
            <p className="truncate text-ui-xs text-foreground-subtlest">
              {intl.formatMessage(
                { id: "teaching.chat.skillHint" },
                { skill: TEACHING_PANEL_SKILLS[panelId] },
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={includeContext ? "default" : "outline"}
              onClick={() => setIncludeContext(!includeContext)}
              title={intl.formatMessage({ id: "teaching.chat.contextToggleHint" })}
            >
              {includeContext ? (
                <Link2 className="size-3.5" aria-hidden />
              ) : (
                <Link2Off className="size-3.5" aria-hidden />
              )}
              {intl.formatMessage({
                id: includeContext ? "teaching.chat.contextOn" : "teaching.chat.contextOff",
              })}
            </Button>
            {starterItem && !sessionId ? (
              <Button size="sm" variant="outline" onClick={handleStarterClick}>
                <Sparkles className="size-3.5" aria-hidden />
                {intl.formatMessage({ id: "teaching.chat.starter" })}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={handleNewChat} disabled={!sessionId}>
              <MessageSquarePlus className="size-3.5" aria-hidden />
              {intl.formatMessage({ id: "teaching.chat.new" })}
            </Button>
          </div>
        </div>
        <TeachingWorkspacePicker
          scope={scope}
          isDesktop={Boolean(isDesktop)}
          onSelect={onWorkspaceSelect}
        />
        {activeSummary ? (
          <div className="jzx-context-chip rounded-md border border-border/80 bg-accent/40 px-2.5 py-1.5">
            <div className="truncate text-ui-xs font-medium text-foreground">
              {intl.formatMessage({ id: "teaching.chat.editing" }, { title: activeSummary.title })}
            </div>
            <div className="truncate text-ui-xs text-foreground-subtlest">
              {activeSummary.excerpt || intl.formatMessage({ id: "teaching.chat.editingEmpty" })}
            </div>
          </div>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <V4PaneConversationProvider scope={scope}>
          <TeachingApplyDock
            panelId={panelId}
            sessionId={sessionId}
            workspacePath={workspacePath}
            workspaceIdentity={workspaceIdentity}
          />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <SessionPane
              acceptExternalTextInsertInSession
              prepareUserText={(text) =>
                buildTeachingAskPrompt({
                  panelId,
                  promptBody: text,
                  workspacePath,
                  workspaceIdentity,
                  locale,
                  includeContext,
                })
              }
              paneId={paneId}
              sessionId={sessionId}
              openTrigger="sidebar"
              focused
              telemetryVisible
              workspacePath={workspacePath}
              workspaceIdentity={workspaceIdentity}
              remoteSessionId={remoteSessionId}
              isDesktop={Boolean(isDesktop)}
              onSessionCreated={handleSessionCreated}
              onSessionDeleted={handleSessionDeleted}
            />
          </div>
        </V4PaneConversationProvider>
      </div>
    </section>
  );
}

/** 仅在发送边界冻结技能、课程和画布上下文；禁止用于输入框预填。 */
export function buildTeachingAskPrompt(input: {
  panelId: TeachingPanelId;
  promptBody: string;
  workspacePath: string;
  workspaceIdentity?: string;
  locale: string;
  includeContext: boolean;
}): string {
  const data = useTeachingWorkbenchStore
    .getState()
    .ensureWorkspace(input.workspacePath, input.workspaceIdentity);
  const appendix = buildTeachingContextAppendix(input.panelId, data, input.locale);
  const canvas =
    useTeachingCanvasStore.getState().drafts[
      teachingCanvasKey(input.workspacePath, input.workspaceIdentity, input.panelId)
    ];
  const uiContext =
    input.includeContext && canvas?.surface
      ? `\n[当前智能画布 / Current canvas]\n${JSON.stringify({ surface: canvas.surface, values: canvas.values }).slice(0, 30000)}`
      : "";
  const body = wrapPromptWithTeachingContext(
    buildPanelPrefillPrompt(input.panelId, input.promptBody),
    appendix,
    input.includeContext,
  );
  return (
    body +
    (body.includes("[教智星智能画布 / Teaching canvas]") ? "" : TEACHING_CANVAS_INSTRUCTIONS) +
    (body.includes("[当前智能画布 / Current canvas]") ? "" : uiContext) +
    TEACHING_ARTIFACT_INSTRUCTIONS +
    TEACHING_VISUAL_DESIGN_INSTRUCTIONS
  );
}
