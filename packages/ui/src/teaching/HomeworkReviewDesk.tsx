import { Sparkles } from "lucide-react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";
import { toast } from "@/components/ui/toast.js";
import { TeachingField, TeachingSection } from "@/teaching/TeachingFormPrimitives.js";
import { useTeachingWorkspaceData } from "@/teaching/useTeachingWorkspaceData.js";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";
import { teachingWorkspaceKey, useTeachingEvidenceStore } from "@/store/teachingEvidenceStore.js";

export function HomeworkReviewDesk({
  workspacePath,
  workspaceIdentity,
}: {
  workspacePath: string;
  workspaceIdentity?: string;
}) {
  const { intl } = useJiaoZhiXingIntl();
  const data = useTeachingWorkspaceData(workspacePath, workspaceIdentity);
  const updateSubmission = useTeachingWorkbenchStore((s) => s.updateSubmission);
  const record = useTeachingEvidenceStore((s) => s.record);
  const workspaceKey = teachingWorkspaceKey(workspacePath, workspaceIdentity);

  if (!data) return null;

  const applySuggestion = (submissionId: string, alias: string, answer: string) => {
    const correctMeaning = /对流.*导热|相对.*导热|无量纲|导热的增强|换热能力/.test(answer);
    const confusesWithRe = /就是雷诺|等于雷诺|Nu\s*=\s*Re|就是\s*Re/i.test(answer);
    const linksToH = /换热系数|h\s*更|对流更强|换热更强|换热越强/i.test(answer);
    let score = 4;
    const notes: string[] = [];
    if (correctMeaning) {
      score += 3;
      notes.push("Nu 的物理意义表述基本正确。");
    } else {
      notes.push("请补充 Nu 表征对流相对纯导热的增强程度。");
    }
    if (confusesWithRe) {
      score -= 2;
      notes.push("将 Nu 与雷诺数 Re 混淆，需纠正。");
    }
    if (linksToH) {
      score += 2;
      notes.push("能联系到对流换热增强/h 增大。");
    } else if (!confusesWithRe) {
      notes.push("可补充：Nu 增大通常对应更强的对流换热。");
    }
    score = Math.max(0, Math.min(10, score));
    updateSubmission(workspacePath, workspaceIdentity, submissionId, {
      suggestedScore: score,
      feedback: `【建议分 ${score}/10，供教师审定】${alias}：${notes.join(" ")}`,
    });
    toast(intl.formatMessage({ id: "teaching.review.suggested" }));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg border border-border bg-accent/40 px-3 py-2 text-ui-caption text-foreground-subtle">
        {intl.formatMessage({ id: "teaching.review.disclaimer" })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            for (const submission of data.submissions) {
              applySuggestion(submission.id, submission.alias, submission.answer);
            }
            record({
              workspaceKey,
              kind: "review-batch",
              panelId: "review-desk",
              summary: intl.formatMessage(
                { id: "teaching.review.batchRecorded" },
                { count: data.submissions.length },
              ),
            });
            toast(
              intl.formatMessage(
                { id: "teaching.review.batchDone" },
                { count: data.submissions.length },
              ),
            );
          }}
        >
          <Sparkles className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.review.batchSuggest" })}
        </Button>
      </div>
      {data.submissions.map((submission) => (
        <TeachingSection
          key={submission.id}
          title={submission.alias}
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => applySuggestion(submission.id, submission.alias, submission.answer)}
            >
              <Sparkles className="size-3.5" aria-hidden />
              {intl.formatMessage({ id: "teaching.review.autoSuggest" })}
            </Button>
          }
        >
          <div>
            <div className="mb-1 text-ui-caption text-foreground-subtle">
              {intl.formatMessage({ id: "teaching.review.prompt" })}
            </div>
            <p className="text-ui-base whitespace-pre-wrap">{submission.prompt}</p>
          </div>
          <div>
            <div className="mb-1 text-ui-caption text-foreground-subtle">
              {intl.formatMessage({ id: "teaching.review.answer" })}
            </div>
            <p className="jzx-answer-block rounded-md p-3 text-ui-base whitespace-pre-wrap">
              {submission.answer}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[140px_1fr]">
            <TeachingField label={intl.formatMessage({ id: "teaching.review.score" })}>
              <Input
                type="number"
                value={submission.suggestedScore ?? ""}
                onChange={(e) =>
                  updateSubmission(workspacePath, workspaceIdentity, submission.id, {
                    suggestedScore: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </TeachingField>
            <TeachingField label={intl.formatMessage({ id: "teaching.review.feedback" })}>
              <Textarea
                className="min-h-20"
                value={submission.feedback}
                onChange={(e) =>
                  updateSubmission(workspacePath, workspaceIdentity, submission.id, {
                    feedback: e.target.value,
                  })
                }
              />
            </TeachingField>
          </div>
        </TeachingSection>
      ))}
    </div>
  );
}
