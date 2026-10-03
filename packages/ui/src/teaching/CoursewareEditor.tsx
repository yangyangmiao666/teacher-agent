import { CoursewarePages } from "./CoursewarePages.js";
import { useTeachingPanelChatStore } from "@/store/teachingPanelChatStore.js";
import { useMemo } from "react";
import { Download, Plus } from "lucide-react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";
import { toast } from "@/components/ui/toast.js";
import { buildCoursewareMarkdown } from "@/teaching/teachingSeed.js";
import {
  TeachingField,
  TeachingSection,
  TeachingToolbar,
} from "@/teaching/TeachingFormPrimitives.js";
import { useTeachingWorkspaceData } from "@/teaching/useTeachingWorkspaceData.js";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";
import { useTeachingCoursewareExport } from "@/hooks/useTeachingCoursewareExport.js";

export function CoursewareEditor({
  workspacePath,
  workspaceIdentity,
}: {
  workspacePath: string;
  workspaceIdentity?: string;
}) {
  const { intl, locale } = useJiaoZhiXingIntl();
  const { exporting, download } = useTeachingCoursewareExport({ workspacePath, workspaceIdentity });
  const data = useTeachingWorkspaceData(workspacePath, workspaceIdentity);
  const updateCourseware = useTeachingWorkbenchStore((s) => s.updateCourseware);
  const setActiveCourseware = useTeachingWorkbenchStore((s) => s.setActiveCourseware);
  const requestPrefill = useTeachingPanelChatStore((s) => s.requestPanelPrefill);
  const addCourseware = useTeachingWorkbenchStore((s) => s.addCourseware);

  const item = useMemo(
    () =>
      data
        ? (data.coursewares.find((entry) => entry.id === data.activeCoursewareId) ??
          data.coursewares[0] ??
          null)
        : null,
    [data],
  );

  if (!data || !item) {
    return (
      <div className="flex flex-col items-start gap-3 p-2">
        <p className="text-ui-base text-foreground-subtle">
          {intl.formatMessage({ id: "teaching.courseware.empty" })}
        </p>
        <Button onClick={() => addCourseware(workspacePath, workspaceIdentity)}>
          <Plus className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.courseware.create" })}
        </Button>
      </div>
    );
  }

  const patch = (partial: Partial<typeof item>) =>
    updateCourseware(workspacePath, workspaceIdentity, item.id, partial);

  const exportMarkdown = async () => {
    const markdown = buildCoursewareMarkdown(item);
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
        <select
          className="h-9 min-w-48 rounded-md border border-border bg-background px-2 text-ui-base"
          value={item.id}
          onChange={(event) =>
            setActiveCourseware(workspacePath, workspaceIdentity, event.target.value)
          }
          aria-label={intl.formatMessage({ id: "teaching.courseware.select" })}
        >
          {data.coursewares.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addCourseware(workspacePath, workspaceIdentity)}
        >
          <Plus className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.courseware.create" })}
        </Button>
        <Button
          size="sm"
          data-testid="courseware-generate"
          onClick={() =>
            requestPrefill(
              workspacePath,
              workspaceIdentity,
              "courseware-editor",
              intl.formatMessage(
                { id: "teaching.courseware.generatePrompt" },
                { course: item.courseName, title: item.title },
              ),
            )
          }
        >
          {intl.formatMessage({ id: "teaching.courseware.generate" })}
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          disabled={exporting}
          onClick={() => {
            void download(item, locale).catch(() =>
              toast(intl.formatMessage({ id: "teaching.export.failed" })),
            );
          }}
          data-testid="teaching-courseware-pptx"
        >
          <Download className="size-3.5" aria-hidden />
          {intl.formatMessage({
            id: exporting ? "teaching.courseware.exportingPptx" : "teaching.courseware.exportPptx",
          })}
        </Button>
        <Button size="sm" onClick={() => void exportMarkdown()}>
          <Download className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.courseware.export" })}
        </Button>
      </TeachingToolbar>

      <TeachingSection title={intl.formatMessage({ id: "teaching.courseware.section.meta" })}>
        <div className="grid gap-3 md:grid-cols-2">
          <TeachingField
            label={intl.formatMessage({ id: "teaching.courseware.field.title" })}
            fieldId="title"
          >
            <Input value={item.title} onChange={(e) => patch({ title: e.target.value })} />
          </TeachingField>
          <TeachingField
            label={intl.formatMessage({ id: "teaching.courseware.field.course" })}
            fieldId="courseName"
          >
            <Input
              value={item.courseName}
              onChange={(e) => patch({ courseName: e.target.value })}
            />
          </TeachingField>
        </div>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.courseware.field.goals" })}
          fieldId="goals"
        >
          <Textarea
            className="min-h-20"
            value={item.goals}
            onChange={(e) => patch({ goals: e.target.value })}
          />
        </TeachingField>
      </TeachingSection>

      <CoursewarePages slides={item.slides ?? []} onChange={(slides) => patch({ slides })} />

      <TeachingSection title={intl.formatMessage({ id: "teaching.courseware.section.outline" })}>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.courseware.field.outline" })}
          fieldId="outline"
        >
          <Textarea
            className="min-h-40"
            value={item.outline}
            onChange={(e) => patch({ outline: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.courseware.field.interactions" })}
          fieldId="interactions"
        >
          <Textarea
            className="min-h-24"
            value={item.interactions}
            onChange={(e) => patch({ interactions: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.courseware.field.script" })}
          fieldId="scriptNotes"
        >
          <Textarea
            className="min-h-24"
            value={item.scriptNotes}
            onChange={(e) => patch({ scriptNotes: e.target.value })}
          />
        </TeachingField>
      </TeachingSection>
    </div>
  );
}
