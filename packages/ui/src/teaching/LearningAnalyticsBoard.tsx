import { useMemo } from "react";
import { BookOpenCheck, Copy, NotebookPen, Sparkles } from "lucide-react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { toast } from "@/components/ui/toast.js";
import { TeachingKpi, TeachingSection } from "@/teaching/TeachingFormPrimitives.js";
import { useTeachingWorkspaceData } from "@/teaching/useTeachingWorkspaceData.js";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";
import { useTeachingPanelChatStore } from "@/store/teachingPanelChatStore.js";
import { teachingWorkspaceKey, useTeachingEvidenceStore } from "@/store/teachingEvidenceStore.js";

export function LearningAnalyticsBoard({
  workspacePath,
  workspaceIdentity,
  onAskAgent,
}: {
  workspacePath: string;
  workspaceIdentity?: string;
  onAskAgent?: (prompt: string) => void;
}) {
  const { intl } = useJiaoZhiXingIntl();
  const data = useTeachingWorkspaceData(workspacePath, workspaceIdentity);
  const openExamForKnowledge = useTeachingWorkbenchStore((s) => s.openExamForKnowledge);
  const setActivePanel = useTeachingWorkbenchStore((s) => s.setActivePanel);
  const requestPanelPrefill = useTeachingPanelChatStore((s) => s.requestPanelPrefill);
  const record = useTeachingEvidenceStore((s) => s.record);
  const workspaceKey = teachingWorkspaceKey(workspacePath, workspaceIdentity);

  const ranked = useMemo(
    () => (data ? [...data.knowledgeStats].sort((a, b) => a.avgScoreRate - b.avgScoreRate) : []),
    [data],
  );
  const weak = ranked.filter((item) => item.avgScoreRate < 60);
  const averageRate = useMemo(() => {
    if (!data || data.knowledgeStats.length === 0) return 0;
    const sum = data.knowledgeStats.reduce((acc, item) => acc + item.avgScoreRate, 0);
    return Math.round(sum / data.knowledgeStats.length);
  }, [data]);

  if (!data) return null;

  const copyHint = async (hint: string) => {
    try {
      await navigator.clipboard.writeText(hint);
      toast(intl.formatMessage({ id: "teaching.analytics.hintCopied" }));
    } catch {
      toast(intl.formatMessage({ id: "teaching.export.failed" }));
    }
  };

  const askForKnowledge = (knowledgeId: string, label: string, rate: number) => {
    const prompt = intl.formatMessage(
      { id: "teaching.analytics.agentPrompt.knowledge" },
      { knowledgeId, label, rate },
    );
    if (onAskAgent) {
      onAskAgent(prompt);
      return;
    }
    void navigator.clipboard.writeText(prompt).then(
      () => toast(intl.formatMessage({ id: "teaching.agentPrompt.copied" })),
      () => toast(intl.formatMessage({ id: "teaching.export.failed" })),
    );
  };

  const startReteachLesson = (knowledgeId: string, label: string, rate: number) => {
    const body = intl.formatMessage(
      { id: "teaching.analytics.reteachLessonPrompt" },
      { knowledgeId, label, rate },
    );
    setActivePanel("lesson-editor");
    requestPanelPrefill(workspacePath, workspaceIdentity, "lesson-editor", body);
    record({
      workspaceKey,
      kind: "loop-reteach",
      panelId: "lesson-editor",
      knowledgeLabel: label,
      summary: intl.formatMessage({ id: "teaching.analytics.reteachRecorded" }, { label }),
    });
    toast(intl.formatMessage({ id: "teaching.analytics.reteachStarted" }, { label }));
  };

  const startTargetedExam = (knowledgeId: string, label: string, rate: number) => {
    openExamForKnowledge(workspacePath, workspaceIdentity, knowledgeId);
    const body = intl.formatMessage(
      { id: "teaching.analytics.targetedExamPrompt" },
      { knowledgeId, label, rate },
    );
    requestPanelPrefill(workspacePath, workspaceIdentity, "exam-builder", body);
    record({
      workspaceKey,
      kind: "loop-exam",
      panelId: "exam-builder",
      knowledgeLabel: label,
      summary: intl.formatMessage({ id: "teaching.analytics.examRecorded" }, { label }),
    });
    toast(intl.formatMessage({ id: "teaching.analytics.examStarted" }, { label }));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg border border-border bg-accent/40 px-3 py-2 text-ui-caption text-foreground-subtle">
        {intl.formatMessage({ id: "teaching.analytics.disclaimer" })}
      </p>
      <p className="rounded-lg border border-brand/20 bg-card px-3 py-2 text-ui-caption text-foreground-subtle">
        {intl.formatMessage({ id: "teaching.analytics.loopBanner" })}
      </p>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TeachingKpi
          label={intl.formatMessage({ id: "teaching.analytics.kpi.points" })}
          value={String(data.knowledgeStats.length)}
        />
        <TeachingKpi
          label={intl.formatMessage({ id: "teaching.analytics.kpi.weak" })}
          value={String(weak.length)}
          tone="warning"
        />
        <TeachingKpi
          label={intl.formatMessage({ id: "teaching.analytics.kpi.average" })}
          value={`${averageRate}%`}
          tone="brand"
        />
        <TeachingKpi
          label={intl.formatMessage({ id: "teaching.analytics.kpi.lowest" })}
          value={ranked[0] ? `${ranked[0].label} ${ranked[0].avgScoreRate}%` : "—"}
          tone="warning"
        />
      </section>

      <TeachingSection title={intl.formatMessage({ id: "teaching.analytics.chartTitle" })}>
        <div className="flex flex-col gap-3">
          {ranked.map((item) => (
            <div key={item.knowledgeId} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-ui-caption">
                <span>
                  {item.knowledgeId} {item.label}
                </span>
                <span className="text-foreground-subtle">
                  {item.avgScoreRate}% · &lt;60% {item.belowSixtyRate}%
                </span>
              </div>
              <div className="jzx-meter h-2.5 overflow-hidden rounded-full">
                <div
                  className={item.avgScoreRate < 60 ? "jzx-meter-fill-warn" : "jzx-meter-fill"}
                  style={{ width: `${Math.max(4, Math.min(100, item.avgScoreRate))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </TeachingSection>

      <TeachingSection title={intl.formatMessage({ id: "teaching.analytics.weakActionsTitle" })}>
        {weak.length === 0 ? (
          <p className="text-ui-base text-foreground-subtle">
            {intl.formatMessage({ id: "teaching.analytics.adviceNone" })}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {weak.map((item) => {
              const hint =
                item.reteachHint?.trim() ||
                intl.formatMessage(
                  { id: "teaching.analytics.adviceItem" },
                  { label: item.label, rate: item.avgScoreRate },
                );
              return (
                <li
                  key={item.knowledgeId}
                  className="rounded-lg border border-border bg-surface/70 p-3"
                >
                  <div className="mb-1 text-ui-base font-medium">
                    {item.knowledgeId} {item.label}
                    <span className="ml-2 text-ui-caption text-foreground-subtle">
                      {item.avgScoreRate}%
                    </span>
                  </div>
                  <p className="mb-3 text-ui-caption text-foreground-subtle">{hint}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void copyHint(hint)}>
                      <Copy className="size-3.5" aria-hidden />
                      {intl.formatMessage({ id: "teaching.analytics.copyHint" })}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        startTargetedExam(item.knowledgeId, item.label, item.avgScoreRate)
                      }
                    >
                      <BookOpenCheck className="size-3.5" aria-hidden />
                      {intl.formatMessage({ id: "teaching.analytics.targetedExam" })}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        startReteachLesson(item.knowledgeId, item.label, item.avgScoreRate)
                      }
                    >
                      <NotebookPen className="size-3.5" aria-hidden />
                      {intl.formatMessage({ id: "teaching.analytics.reteachLesson" })}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        askForKnowledge(item.knowledgeId, item.label, item.avgScoreRate)
                      }
                    >
                      <Sparkles className="size-3.5" aria-hidden />
                      {intl.formatMessage({ id: "teaching.analytics.askAgent" })}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </TeachingSection>
    </div>
  );
}
