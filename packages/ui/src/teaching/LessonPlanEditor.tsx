import { useMemo } from "react";
import { Download, Plus } from "lucide-react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";
import { toast } from "@/components/ui/toast.js";
import { buildLessonMarkdown } from "@/teaching/teachingSeed.js";
import {
  TeachingField,
  TeachingSection,
  TeachingToolbar,
} from "@/teaching/TeachingFormPrimitives.js";
import { useTeachingWorkspaceData } from "@/teaching/useTeachingWorkspaceData.js";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";

export function LessonPlanEditor({
  workspacePath,
  workspaceIdentity,
}: {
  workspacePath: string;
  workspaceIdentity?: string;
}) {
  const { intl } = useJiaoZhiXingIntl();
  const data = useTeachingWorkspaceData(workspacePath, workspaceIdentity);
  const updateLesson = useTeachingWorkbenchStore((s) => s.updateLesson);
  const setActiveLesson = useTeachingWorkbenchStore((s) => s.setActiveLesson);
  const addLesson = useTeachingWorkbenchStore((s) => s.addLesson);

  const lesson = useMemo(
    () =>
      data
        ? (data.lessons.find((item) => item.id === data.activeLessonId) ?? data.lessons[0] ?? null)
        : null,
    [data],
  );

  if (!data || !lesson) {
    return (
      <div className="flex flex-col items-start gap-3 p-2">
        <p className="text-ui-base text-foreground-subtle">
          {intl.formatMessage({ id: "teaching.lesson.empty" })}
        </p>
        <Button onClick={() => addLesson(workspacePath, workspaceIdentity)}>
          <Plus className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.lesson.create" })}
        </Button>
      </div>
    );
  }

  const patch = (partial: Partial<typeof lesson>) =>
    updateLesson(workspacePath, workspaceIdentity, lesson.id, partial);

  const exportMarkdown = async () => {
    const markdown = buildLessonMarkdown(lesson);
    try {
      await navigator.clipboard.writeText(markdown);
      toast(intl.formatMessage({ id: "teaching.export.copied" }));
    } catch {
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `教案-${lesson.title}.md`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast(intl.formatMessage({ id: "teaching.export.downloaded" }));
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <TeachingToolbar>
        <select
          className="h-9 min-w-48 rounded-md border border-border bg-background px-2 text-ui-base"
          value={lesson.id}
          onChange={(event) =>
            setActiveLesson(workspacePath, workspaceIdentity, event.target.value)
          }
          aria-label={intl.formatMessage({ id: "teaching.lesson.select" })}
        >
          {data.lessons.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addLesson(workspacePath, workspaceIdentity)}
        >
          <Plus className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.lesson.create" })}
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={() => void exportMarkdown()}>
          <Download className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.lesson.export" })}
        </Button>
      </TeachingToolbar>

      <TeachingSection title={intl.formatMessage({ id: "teaching.lesson.section.meta" })}>
        <div className="grid gap-3 md:grid-cols-2">
          <TeachingField
            label={intl.formatMessage({ id: "teaching.lesson.field.title" })}
            fieldId="title"
          >
            <Input value={lesson.title} onChange={(e) => patch({ title: e.target.value })} />
          </TeachingField>
          <TeachingField
            label={intl.formatMessage({ id: "teaching.lesson.field.course" })}
            fieldId="courseName"
          >
            <Input
              value={lesson.courseName}
              onChange={(e) => patch({ courseName: e.target.value })}
            />
          </TeachingField>
          <TeachingField
            label={intl.formatMessage({ id: "teaching.lesson.field.hours" })}
            fieldId="hours"
          >
            <Input
              type="number"
              value={lesson.hours}
              onChange={(e) => patch({ hours: Number(e.target.value) || 0 })}
            />
          </TeachingField>
          <TeachingField
            label={intl.formatMessage({ id: "teaching.lesson.field.audience" })}
            fieldId="audience"
          >
            <Input value={lesson.audience} onChange={(e) => patch({ audience: e.target.value })} />
          </TeachingField>
        </div>
      </TeachingSection>

      <TeachingSection title={intl.formatMessage({ id: "teaching.lesson.section.goals" })}>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.lesson.field.objectives" })}
          fieldId="objectives"
        >
          <Textarea
            className="min-h-28"
            value={lesson.objectives}
            onChange={(e) => patch({ objectives: e.target.value })}
          />
        </TeachingField>
        <div className="grid gap-3 md:grid-cols-2">
          <TeachingField
            label={intl.formatMessage({ id: "teaching.lesson.field.keyPoints" })}
            fieldId="keyPoints"
          >
            <Textarea
              className="min-h-24"
              value={lesson.keyPoints}
              onChange={(e) => patch({ keyPoints: e.target.value })}
            />
          </TeachingField>
          <TeachingField
            label={intl.formatMessage({ id: "teaching.lesson.field.difficulties" })}
            fieldId="difficulties"
          >
            <Textarea
              className="min-h-24"
              value={lesson.difficulties}
              onChange={(e) => patch({ difficulties: e.target.value })}
            />
          </TeachingField>
        </div>
      </TeachingSection>

      <TeachingSection title={intl.formatMessage({ id: "teaching.lesson.section.process" })}>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.lesson.field.process" })}
          fieldId="process"
        >
          <Textarea
            className="min-h-36"
            value={lesson.process}
            onChange={(e) => patch({ process: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.lesson.field.ideology" })}
          fieldId="ideologyNotes"
        >
          <Textarea
            className="min-h-20"
            value={lesson.ideologyNotes}
            onChange={(e) => patch({ ideologyNotes: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.lesson.field.homework" })}
          fieldId="homework"
        >
          <Textarea
            className="min-h-20"
            value={lesson.homework}
            onChange={(e) => patch({ homework: e.target.value })}
          />
        </TeachingField>
      </TeachingSection>

      <TeachingSection
        title={intl.formatMessage({ id: "teaching.lesson.section.obe" })}
        description={intl.formatMessage({ id: "teaching.lesson.section.obe.desc" })}
      >
        <div className="flex flex-col gap-2" data-teaching-field="outcomeAlignment">
          {(lesson.outcomeAlignment ?? []).length === 0 ? (
            <p className="text-ui-caption text-foreground-subtle">
              {intl.formatMessage({ id: "teaching.lesson.obe.empty" })}
            </p>
          ) : (
            (lesson.outcomeAlignment ?? []).map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-2 rounded-md border border-border/80 bg-surface/50 px-2.5 py-2"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={item.covered}
                  onChange={(event) => {
                    const next = (lesson.outcomeAlignment ?? []).map((row) =>
                      row.id === item.id ? { ...row, covered: event.target.checked } : row,
                    );
                    patch({ outcomeAlignment: next });
                  }}
                />
                <span className="min-w-0">
                  <span className="text-ui-caption font-medium text-brand">{item.code}</span>
                  <span className="mt-0.5 block text-ui-caption text-foreground">
                    {item.statement}
                  </span>
                </span>
              </label>
            ))
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const next = [
                ...(lesson.outcomeAlignment ?? []),
                {
                  id: `co-${Math.random().toString(36).slice(2, 7)}`,
                  code: `CO${(lesson.outcomeAlignment?.length ?? 0) + 1}`,
                  statement: "",
                  covered: false,
                },
              ];
              patch({ outcomeAlignment: next });
            }}
          >
            {intl.formatMessage({ id: "teaching.lesson.obe.add" })}
          </Button>
        </div>
      </TeachingSection>
    </div>
  );
}
