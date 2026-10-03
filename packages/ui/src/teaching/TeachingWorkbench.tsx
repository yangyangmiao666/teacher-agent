import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  FileStack,
  FlaskConical,
  Library,
  NotebookPen,
  Presentation,
  Sparkles,
} from "lucide-react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { AutomationsMainBreadcrumbFrame } from "@/settings/AutomationsMainBreadcrumbFrame.js";
import { CaseLibrary } from "@/teaching/CaseLibrary.js";
import { CoursewareEditor } from "@/teaching/CoursewareEditor.js";
import { ExamPaperBuilder } from "@/teaching/ExamPaperBuilder.js";
import { HomeworkReviewDesk } from "@/teaching/HomeworkReviewDesk.js";
import { LabMaterialEditor } from "@/teaching/LabMaterialEditor.js";
import { LearningAnalyticsBoard } from "@/teaching/LearningAnalyticsBoard.js";
import { LessonPlanEditor } from "@/teaching/LessonPlanEditor.js";
import { TeachingChatPanel } from "@/teaching/TeachingChatPanel.js";
import { TeachingEvidencePanel } from "@/teaching/TeachingEvidencePanel.js";
import { TeachingDemoScript } from "@/teaching/TeachingDemoScript.js";
import {
  TEACHING_PANELS,
  TEACHING_STAGES,
  type TeachingPanelId,
  type TeachingStageId,
} from "@/teaching/teachingTypes.js";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";
import {
  teachingPanelBindingKey,
  useTeachingPanelChatStore,
} from "@/store/teachingPanelChatStore.js";
import "@/teaching/teaching-workbench.css";

import { TeachingCanvas } from "./TeachingCanvas.js";
import { teachingCanvasKey, useTeachingCanvasStore } from "@/store/teachingCanvasStore.js";

const PANEL_ICONS = {
  "lesson-editor": NotebookPen,
  "courseware-editor": Presentation,
  "case-library": Library,
  "exam-builder": BookOpenCheck,
  "review-desk": ClipboardCheck,
  "analytics-board": BarChart3,
  "lab-editor": FlaskConical,
} as const;

function stageForPanel(panel: TeachingPanelId): TeachingStageId {
  return TEACHING_PANELS.find((item) => item.id === panel)?.stage ?? "preclass";
}

function firstPanelForStage(stage: TeachingStageId): TeachingPanelId | null {
  if (stage === "home") return null;
  return TEACHING_PANELS.find((panel) => panel.stage === stage)?.id ?? null;
}

export function TeachingWorkbench({
  workspacePath: baseWorkspacePath,
  workspaceIdentity: baseWorkspaceIdentity,
  remoteSessionId: baseRemoteSessionId,
  isDesktop,
  onAskAgent: _onAskAgent,
}: {
  workspacePath: string;
  workspaceIdentity?: string;
  remoteSessionId?: string | null;
  isDesktop?: boolean;
  /**
   * 兼容旧接线：外部若仍传入，现已由内嵌对话承接；保留参数以免破坏调用方类型。
   */
  onAskAgent?: (prompt: string) => void;
}) {
  void _onAskAgent;
  const { intl, locale } = useJiaoZhiXingIntl();
  const activePanel = useTeachingWorkbenchStore((s) => s.activePanel);
  const setActivePanel = useTeachingWorkbenchStore((s) => s.setActivePanel);
  const baseScope = useMemo(
    () => ({
      workspacePath: baseWorkspacePath,
      workspaceIdentity: baseWorkspaceIdentity,
      remoteSessionId: baseRemoteSessionId,
    }),
    [baseWorkspacePath, baseWorkspaceIdentity, baseRemoteSessionId],
  );
  const binding = useTeachingPanelChatStore(
    (s) => s.workspaceBindings[teachingPanelBindingKey(baseScope, activePanel)],
  );
  const { workspacePath, workspaceIdentity, remoteSessionId } = binding ?? baseScope;
  const setPanelWorkspace = useTeachingPanelChatStore((s) => s.setPanelWorkspace);
  const ensureWorkspace = useTeachingWorkbenchStore((s) => s.ensureWorkspace);
  const resetWorkspace = useTeachingWorkbenchStore((s) => s.resetWorkspace);
  const requestPanelPrefill = useTeachingPanelChatStore((s) => s.requestPanelPrefill);
  const stage = stageForPanel(activePanel);
  const [canvasVisible, setCanvasVisible] = useState(true);
  const canvasKey = teachingCanvasKey(workspacePath, workspaceIdentity, activePanel);
  const ensureCanvas = useTeachingCanvasStore((s) => s.ensure);
  useEffect(() => ensureCanvas(canvasKey), [ensureCanvas, canvasKey]);
  const surface = useTeachingCanvasStore((s) => s.drafts[canvasKey]?.surface);
  const selectedArtifactId = useTeachingCanvasStore((s) => s.drafts[canvasKey]?.selectedArtifactId);
  useEffect(() => setCanvasVisible(true), [canvasKey]);
  useEffect(() => {
    if (surface || selectedArtifactId) setCanvasVisible(true);
  }, [surface, selectedArtifactId, canvasKey]);

  useEffect(() => {
    ensureWorkspace(workspacePath, workspaceIdentity);
  }, [ensureWorkspace, workspaceIdentity, workspacePath]);

  const stagePanels = useMemo(
    () => TEACHING_PANELS.filter((panel) => panel.stage === stage),
    [stage],
  );

  const askAgent = (messageId: string, values?: Record<string, string | number>) => {
    const promptBody = intl.formatMessage({ id: messageId }, values);
    requestPanelPrefill(workspacePath, workspaceIdentity, activePanel, promptBody);
  };

  const selectStage = (nextStage: TeachingStageId) => {
    const panelId = firstPanelForStage(nextStage);
    if (panelId) setActivePanel(panelId);
  };

  const ActiveIcon = PANEL_ICONS[activePanel] ?? FileStack;
  const activeMeta = TEACHING_PANELS.find((panel) => panel.id === activePanel);

  return (
    <main
      className="jzx-shell flex h-full min-h-0 flex-1 flex-col"
      data-testid="teaching-workbench"
      data-teaching-workbench=""
    >
      <AutomationsMainBreadcrumbFrame
        isDesktop={Boolean(isDesktop)}
        sectionLabel={intl.formatMessage({ id: "teaching.workbench.title" })}
        ariaLabel={intl.formatMessage({ id: "teaching.workbench.breadcrumb" })}
      >
        <div className="jzx-content flex min-h-0 flex-1 overflow-hidden">
          <aside className="jzx-stage-rail hidden w-56 shrink-0 flex-col gap-1 overflow-y-auto p-3 md:flex">
            <div className="mb-3 px-2 pt-1">
              <div className="text-ui-xs font-medium tracking-[0.14em] text-foreground-subtlest uppercase">
                {intl.formatMessage({ id: "teaching.stage.rail" })}
              </div>
            </div>
            {TEACHING_STAGES.map((item) => (
              <button
                key={item.id}
                type="button"
                className="jzx-stage-btn flex flex-col gap-0.5 rounded-md px-3 py-2.5 text-left text-foreground-subtle hover:bg-surface-hover hover:text-foreground"
                aria-pressed={stage === item.id}
                onClick={() => selectStage(item.id)}
              >
                <span className="text-ui-base font-medium">
                  {intl.formatMessage({ id: item.labelId })}
                </span>
                <span className="text-ui-xs text-foreground-subtlest">
                  {intl.formatMessage({ id: item.hintId })}
                </span>
              </button>
            ))}
            <div className="mt-4 border-t border-border pt-3">
              <div className="mb-2 px-2 text-ui-xs text-foreground-subtlest">
                {intl.formatMessage({ id: "teaching.workbench.nav" })}
              </div>
              {stagePanels.map((panel) => {
                const Icon = PANEL_ICONS[panel.id];
                return (
                  <button
                    key={panel.id}
                    type="button"
                    className="jzx-stage-btn flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-foreground-subtle hover:bg-surface-hover hover:text-foreground"
                    aria-pressed={activePanel === panel.id}
                    onClick={() => setActivePanel(panel.id)}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="text-ui-sm font-medium">
                      {intl.formatMessage({ id: panel.labelId })}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-auto flex flex-col gap-3 border-t border-border pt-3">
              <TeachingDemoScript
                workspacePath={workspacePath}
                workspaceIdentity={workspaceIdentity}
              />
              <TeachingEvidencePanel
                workspacePath={workspacePath}
                workspaceIdentity={workspaceIdentity}
              />
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="jzx-panel-split flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 md:flex-row md:gap-4 md:p-4">
              <div className="jzx-tool-column flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:max-w-[58%]">
                <div className="mb-2 flex shrink-0 flex-col gap-2 md:hidden">
                  <TeachingDemoScript
                    workspacePath={workspacePath}
                    workspaceIdentity={workspaceIdentity}
                  />
                  <TeachingEvidencePanel
                    workspacePath={workspacePath}
                    workspaceIdentity={workspaceIdentity}
                  />
                </div>
                <div className="mb-2 flex shrink-0 flex-wrap gap-2 md:hidden">
                  <nav
                    className="jzx-stage-pills w-full"
                    aria-label={intl.formatMessage({ id: "teaching.stage.rail" })}
                  >
                    {TEACHING_STAGES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="jzx-stage-pill shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-ui-caption text-foreground-subtle"
                        aria-pressed={stage === item.id}
                        onClick={() => selectStage(item.id)}
                      >
                        {intl.formatMessage({ id: item.labelId })}
                      </button>
                    ))}
                  </nav>
                  {stagePanels.map((panel) => {
                    const Icon = PANEL_ICONS[panel.id];
                    return (
                      <Button
                        key={panel.id}
                        size="sm"
                        variant={activePanel === panel.id ? "default" : "outline"}
                        onClick={() => setActivePanel(panel.id)}
                      >
                        <Icon className="size-3.5" aria-hidden />
                        {intl.formatMessage({ id: panel.labelId })}
                      </Button>
                    );
                  })}
                </div>

                <section className="jzx-panel-frame jzx-rise flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 md:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-lg bg-accent p-2 text-brand">
                        <ActiveIcon className="size-5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-ui-xl font-semibold tracking-tight">
                          {intl.formatMessage({
                            id: activeMeta?.labelId ?? "teaching.workbench.title",
                          })}
                        </h1>
                        <p className="text-ui-caption text-foreground-subtle">
                          {intl.formatMessage({
                            id: activeMeta?.descriptionId ?? "teaching.workbench.subtitle",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCanvasVisible(!canvasVisible)}
                        data-testid="teaching-canvas-toggle"
                      >
                        {locale.startsWith("zh")
                          ? canvasVisible
                            ? "返回编辑器"
                            : "智能画布"
                          : canvasVisible
                            ? "Back to editor"
                            : "Smart canvas"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetWorkspace(workspacePath, workspaceIdentity)}
                      >
                        {intl.formatMessage({ id: "teaching.workbench.resetDemo" })}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          askAgent(activeMeta?.agentPromptId ?? "teaching.agentPrompt.lesson")
                        }
                      >
                        <Sparkles className="size-3.5" aria-hidden />
                        {intl.formatMessage({ id: "teaching.scene.askAgent" })}
                      </Button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
                    <div className="px-4 py-4 md:px-5 md:py-5">
                      {canvasVisible ? (
                        <TeachingCanvas
                          key={canvasKey}
                          panelId={activePanel}
                          workspacePath={workspacePath}
                          workspaceIdentity={workspaceIdentity}
                        />
                      ) : null}
                      <div hidden={canvasVisible}>
                        {activePanel === "lesson-editor" ? (
                          <LessonPlanEditor
                            workspacePath={workspacePath}
                            workspaceIdentity={workspaceIdentity}
                          />
                        ) : null}
                        {activePanel === "courseware-editor" ? (
                          <CoursewareEditor
                            workspacePath={workspacePath}
                            workspaceIdentity={workspaceIdentity}
                          />
                        ) : null}
                        {activePanel === "case-library" ? (
                          <CaseLibrary
                            workspacePath={workspacePath}
                            workspaceIdentity={workspaceIdentity}
                          />
                        ) : null}
                        {activePanel === "exam-builder" ? (
                          <ExamPaperBuilder
                            workspacePath={workspacePath}
                            workspaceIdentity={workspaceIdentity}
                          />
                        ) : null}
                        {activePanel === "review-desk" ? (
                          <HomeworkReviewDesk
                            workspacePath={workspacePath}
                            workspaceIdentity={workspaceIdentity}
                          />
                        ) : null}
                        {activePanel === "analytics-board" ? (
                          <LearningAnalyticsBoard
                            workspacePath={workspacePath}
                            workspaceIdentity={workspaceIdentity}
                            onAskAgent={(prompt) => {
                              requestPanelPrefill(
                                workspacePath,
                                workspaceIdentity,
                                "analytics-board",
                                prompt,
                              );
                            }}
                          />
                        ) : null}
                        {activePanel === "lab-editor" ? (
                          <LabMaterialEditor
                            workspacePath={workspacePath}
                            workspaceIdentity={workspaceIdentity}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="jzx-chat-column flex min-h-[320px] min-w-0 flex-1 flex-col overflow-hidden md:min-h-0 md:max-w-[42%]">
                <TeachingChatPanel
                  key={canvasKey}
                  panelId={activePanel}
                  workspacePath={workspacePath}
                  workspaceIdentity={workspaceIdentity}
                  remoteSessionId={remoteSessionId}
                  isDesktop={isDesktop}
                  onWorkspaceSelect={(scope) => setPanelWorkspace(baseScope, activePanel, scope)}
                />
              </div>
            </div>
          </div>
        </div>
      </AutomationsMainBreadcrumbFrame>
    </main>
  );
}
