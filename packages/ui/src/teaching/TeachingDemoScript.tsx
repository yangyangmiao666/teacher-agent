import { useState } from "react";
import { Clapperboard, Play } from "lucide-react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { toast } from "@/components/ui/toast.js";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";
import { useTeachingPanelChatStore } from "@/store/teachingPanelChatStore.js";
import { teachingWorkspaceKey, useTeachingEvidenceStore } from "@/store/teachingEvidenceStore.js";
import type { TeachingPanelId } from "@/teaching/teachingTypes.js";

interface DemoStep {
  id: string;
  panelId: TeachingPanelId;
  labelId: string;
  hintId: string;
  buildPrompt?: (ctx: {
    intl: ReturnType<typeof useJiaoZhiXingIntl>["intl"];
    weakestLabel: string;
    weakestRate: number;
    weakestId: string;
  }) => string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: "analytics",
    panelId: "analytics-board",
    labelId: "teaching.demo.step.analytics",
    hintId: "teaching.demo.step.analytics.hint",
  },
  {
    id: "reteach",
    panelId: "lesson-editor",
    labelId: "teaching.demo.step.reteach",
    hintId: "teaching.demo.step.reteach.hint",
    buildPrompt: ({ intl, weakestLabel, weakestRate, weakestId }) =>
      intl.formatMessage(
        { id: "teaching.analytics.reteachLessonPrompt" },
        { label: weakestLabel, rate: weakestRate, knowledgeId: weakestId },
      ),
  },
  {
    id: "apply",
    panelId: "lesson-editor",
    labelId: "teaching.demo.step.apply",
    hintId: "teaching.demo.step.apply.hint",
  },
  {
    id: "exam",
    panelId: "exam-builder",
    labelId: "teaching.demo.step.exam",
    hintId: "teaching.demo.step.exam.hint",
    buildPrompt: ({ intl, weakestLabel, weakestRate, weakestId }) =>
      intl.formatMessage(
        { id: "teaching.analytics.targetedExamPrompt" },
        { label: weakestLabel, rate: weakestRate, knowledgeId: weakestId },
      ),
  },
  {
    id: "evidence",
    panelId: "analytics-board",
    labelId: "teaching.demo.step.evidence",
    hintId: "teaching.demo.step.evidence.hint",
  },
];

export function TeachingDemoScript({
  workspacePath,
  workspaceIdentity,
  open: controlledOpen,
  onOpenChange,
}: {
  workspacePath: string;
  workspaceIdentity?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { intl } = useJiaoZhiXingIntl();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [stepIndex, setStepIndex] = useState(0);
  const setActivePanel = useTeachingWorkbenchStore((s) => s.setActivePanel);
  const openExamForKnowledge = useTeachingWorkbenchStore((s) => s.openExamForKnowledge);
  const getWorkspace = useTeachingWorkbenchStore((s) => s.getWorkspace);
  const requestPanelPrefill = useTeachingPanelChatStore((s) => s.requestPanelPrefill);
  const record = useTeachingEvidenceStore((s) => s.record);
  const key = teachingWorkspaceKey(workspacePath, workspaceIdentity);

  const data = getWorkspace(workspacePath, workspaceIdentity);
  const weakest = [...data.knowledgeStats].sort((a, b) => a.avgScoreRate - b.avgScoreRate)[0];
  const weakestLabel = weakest?.label ?? "努塞尔数";
  const weakestRate = weakest?.avgScoreRate ?? 42;
  const weakestId = weakest?.knowledgeId ?? "K-Nu";

  const runStep = (index: number) => {
    const step = DEMO_STEPS[index];
    if (!step) return;
    setStepIndex(index);
    setActivePanel(step.panelId);
    if (step.id === "exam" && weakest) {
      openExamForKnowledge(workspacePath, workspaceIdentity, weakest.knowledgeId);
    }
    if (step.buildPrompt) {
      const body = step.buildPrompt({ intl, weakestLabel, weakestRate, weakestId });
      requestPanelPrefill(workspacePath, workspaceIdentity, step.panelId, body);
    }
    record({
      workspaceKey: key,
      kind: "demo-step",
      panelId: step.panelId,
      summary: intl.formatMessage({ id: step.labelId }),
      knowledgeLabel: weakestLabel,
    });
    toast(intl.formatMessage({ id: "teaching.demo.stepStarted" }, { step: index + 1 }));
  };

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Clapperboard className="size-3.5" aria-hidden />
        {intl.formatMessage({ id: "teaching.demo.open" })}
      </Button>
    );
  }

  return (
    <section
      className="jzx-demo-script rounded-xl border border-brand/25 bg-accent/30 p-3"
      data-testid="teaching-demo-script"
    >
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-ui-sm font-medium">
            {intl.formatMessage({ id: "teaching.demo.title" })}
          </div>
          <p className="text-ui-xs text-foreground-subtle">
            {intl.formatMessage({ id: "teaching.demo.subtitle" })}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          {intl.formatMessage({ id: "teaching.demo.close" })}
        </Button>
      </header>
      <ol className="flex flex-col gap-1.5">
        {DEMO_STEPS.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              className="jzx-demo-step flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-hover"
              aria-current={stepIndex === index ? "step" : undefined}
              data-active={stepIndex === index ? "true" : "false"}
              onClick={() => runStep(index)}
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-ui-xs font-medium text-brand">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-ui-caption font-medium">
                  {intl.formatMessage({ id: step.labelId })}
                </span>
                <span className="block text-ui-xs text-foreground-subtlest">
                  {intl.formatMessage({ id: step.hintId })}
                </span>
              </span>
              <Play className="mt-1 size-3.5 shrink-0 text-foreground-subtlest" aria-hidden />
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-ui-xs text-foreground-subtlest">
        {intl.formatMessage({ id: "teaching.demo.privacy" })}
      </p>
    </section>
  );
}
