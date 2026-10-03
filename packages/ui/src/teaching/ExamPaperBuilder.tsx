import { useMemo, useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";
import { toast } from "@/components/ui/toast.js";
import { cn } from "@/components/lib/utils.js";
import { buildBlueprintMarkdown, buildExamMarkdown } from "@/teaching/teachingSeed.js";
import type { ExamDifficulty, ExamQuestion, ExamQuestionType } from "@/teaching/teachingTypes.js";
import {
  TeachingField,
  TeachingSection,
  TeachingToolbar,
} from "@/teaching/TeachingFormPrimitives.js";
import { useTeachingWorkspaceData } from "@/teaching/useTeachingWorkspaceData.js";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";

const QUESTION_TYPES: ExamQuestionType[] = ["single", "fill", "short", "calc"];
const DIFFICULTIES: ExamDifficulty[] = ["easy", "medium", "hard"];

export function ExamPaperBuilder({
  workspacePath,
  workspaceIdentity,
}: {
  workspacePath: string;
  workspaceIdentity?: string;
}) {
  const { intl } = useJiaoZhiXingIntl();
  const data = useTeachingWorkspaceData(workspacePath, workspaceIdentity);
  const upsertQuestion = useTeachingWorkbenchStore((s) => s.upsertQuestion);
  const removeQuestion = useTeachingWorkbenchStore((s) => s.removeQuestion);
  const setPaperTitle = useTeachingWorkbenchStore((s) => s.setPaperTitle);
  const togglePaperQuestion = useTeachingWorkbenchStore((s) => s.togglePaperQuestion);
  const setExamKnowledgeFilter = useTeachingWorkbenchStore((s) => s.setExamKnowledgeFilter);

  const [draft, setDraft] = useState<Omit<ExamQuestion, "id">>({
    type: "single",
    knowledgeId: "K02",
    knowledgeLabel: "对流传热与努塞尔数",
    difficulty: "medium",
    stem: "",
    answer: "",
    score: 5,
  });

  const knowledgeOptions = useMemo(() => {
    if (!data) return [] as Array<{ id: string; label: string }>;
    const map = new Map<string, string>();
    for (const question of data.questions) {
      map.set(question.knowledgeId, question.knowledgeLabel);
    }
    for (const stat of data.knowledgeStats) {
      if (!map.has(stat.knowledgeId)) map.set(stat.knowledgeId, stat.label);
    }
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [data]);

  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    const filter = data.examKnowledgeFilter?.trim();
    if (!filter) return data.questions;
    return data.questions.filter((question) => question.knowledgeId === filter);
  }, [data]);

  const selectedQuestions = useMemo(
    () => (data ? data.questions.filter((q) => data.paper.questionIds.includes(q.id)) : []),
    [data],
  );
  const totalScore = selectedQuestions.reduce((sum, q) => sum + q.score, 0);

  if (!data) return null;

  const addQuestion = () => {
    if (!draft.stem.trim()) {
      toast(intl.formatMessage({ id: "teaching.exam.stemRequired" }));
      return;
    }
    upsertQuestion(workspacePath, workspaceIdentity, {
      ...draft,
      id: `q-${Math.random().toString(36).slice(2, 10)}`,
    });
    setDraft((prev) => ({ ...prev, stem: "", answer: "" }));
  };

  const exportPaper = async (includeAnswers: boolean) => {
    const markdown = includeAnswers
      ? `${buildExamMarkdown(data.paper.title, selectedQuestions, true)}\n\n${buildBlueprintMarkdown(data.paper.title, selectedQuestions)}`
      : buildExamMarkdown(data.paper.title, selectedQuestions, false);
    try {
      await navigator.clipboard.writeText(markdown);
      toast(intl.formatMessage({ id: "teaching.export.copied" }));
    } catch {
      toast(intl.formatMessage({ id: "teaching.export.failed" }));
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <TeachingToolbar>
        <TeachingField
          className="min-w-64 flex-1"
          label={intl.formatMessage({ id: "teaching.exam.paperTitle" })}
        >
          <Input
            value={data.paper.title}
            onChange={(e) => setPaperTitle(workspacePath, workspaceIdentity, e.target.value)}
          />
        </TeachingField>
        <div className="rounded-md bg-accent px-2.5 py-1.5 text-ui-caption text-foreground-subtle">
          {intl.formatMessage(
            { id: "teaching.exam.selectionSummary" },
            { count: selectedQuestions.length, score: totalScore },
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => void exportPaper(false)}>
          <Download className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.exam.exportStudent" })}
        </Button>
        <Button size="sm" onClick={() => void exportPaper(true)}>
          <Download className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.exam.exportTeacher" })}
        </Button>
      </TeachingToolbar>

      <TeachingSection title={intl.formatMessage({ id: "teaching.exam.addQuestion" })}>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-ui-base"
            value={draft.type}
            onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value as ExamQuestionType }))}
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {intl.formatMessage({ id: `teaching.exam.type.${type}` })}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-ui-base"
            value={draft.difficulty}
            onChange={(e) =>
              setDraft((p) => ({ ...p, difficulty: e.target.value as ExamDifficulty }))
            }
          >
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {intl.formatMessage({ id: `teaching.exam.difficulty.${difficulty}` })}
              </option>
            ))}
          </select>
          <Input
            value={draft.knowledgeLabel}
            onChange={(e) => setDraft((p) => ({ ...p, knowledgeLabel: e.target.value }))}
            placeholder={intl.formatMessage({ id: "teaching.exam.knowledge" })}
          />
          <Input
            type="number"
            value={draft.score}
            onChange={(e) => setDraft((p) => ({ ...p, score: Number(e.target.value) || 0 }))}
          />
        </div>
        <Textarea
          className="min-h-20"
          value={draft.stem}
          onChange={(e) => setDraft((p) => ({ ...p, stem: e.target.value }))}
          placeholder={intl.formatMessage({ id: "teaching.exam.stem" })}
        />
        <Textarea
          className="min-h-16"
          value={draft.answer}
          onChange={(e) => setDraft((p) => ({ ...p, answer: e.target.value }))}
          placeholder={intl.formatMessage({ id: "teaching.exam.answer" })}
        />
        <div>
          <Button onClick={addQuestion}>
            <Plus className="size-3.5" aria-hidden />
            {intl.formatMessage({ id: "teaching.exam.add" })}
          </Button>
        </div>
      </TeachingSection>

      <TeachingSection title={intl.formatMessage({ id: "teaching.exam.bank" })}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-ui-caption text-foreground-subtle" htmlFor="exam-knowledge-filter">
            {intl.formatMessage({ id: "teaching.exam.filterKnowledge" })}
          </label>
          <select
            id="exam-knowledge-filter"
            className="h-9 min-w-56 rounded-md border border-border bg-background px-2 text-ui-base"
            value={data.examKnowledgeFilter}
            onChange={(event) =>
              setExamKnowledgeFilter(workspacePath, workspaceIdentity, event.target.value)
            }
          >
            <option value="">{intl.formatMessage({ id: "teaching.exam.filterAll" })}</option>
            {knowledgeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.id} {option.label}
              </option>
            ))}
          </select>
          {data.examKnowledgeFilter ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExamKnowledgeFilter(workspacePath, workspaceIdentity, "")}
            >
              {intl.formatMessage({ id: "teaching.exam.clearFilter" })}
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          {filteredQuestions.length === 0 ? (
            <p className="text-ui-base text-foreground-subtle">
              {intl.formatMessage({ id: "teaching.exam.filterEmpty" })}
            </p>
          ) : null}
          {filteredQuestions.map((question) => {
            const selected = data.paper.questionIds.includes(question.id);
            return (
              <div
                key={question.id}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border border-border bg-surface/70 p-3",
                  selected && "jzx-question-selected",
                )}
              >
                <div className="flex flex-wrap items-center gap-2 text-ui-caption text-foreground-subtle">
                  <span className="rounded-md bg-accent px-1.5 py-0.5 text-brand">
                    {intl.formatMessage({ id: `teaching.exam.type.${question.type}` })}
                  </span>
                  <span>
                    {question.knowledgeId} {question.knowledgeLabel}
                  </span>
                  <span>·</span>
                  <span>
                    {intl.formatMessage({
                      id: `teaching.exam.difficulty.${question.difficulty}`,
                    })}
                  </span>
                  <span>·</span>
                  <span>{question.score}分</span>
                </div>
                <p className="text-ui-base whitespace-pre-wrap">{question.stem}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    onClick={() =>
                      togglePaperQuestion(workspacePath, workspaceIdentity, question.id)
                    }
                  >
                    {selected
                      ? intl.formatMessage({ id: "teaching.exam.unselect" })
                      : intl.formatMessage({ id: "teaching.exam.select" })}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeQuestion(workspacePath, workspaceIdentity, question.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {intl.formatMessage({ id: "teaching.exam.remove" })}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </TeachingSection>
    </div>
  );
}
