import { useMemo } from "react";
import { Download, Plus } from "lucide-react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";
import { toast } from "@/components/ui/toast.js";
import { buildLabMarkdown } from "@/teaching/teachingSeed.js";
import {
  TeachingField,
  TeachingSection,
  TeachingToolbar,
} from "@/teaching/TeachingFormPrimitives.js";
import { useTeachingWorkspaceData } from "@/teaching/useTeachingWorkspaceData.js";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";

export function LabMaterialEditor({
  workspacePath,
  workspaceIdentity,
}: {
  workspacePath: string;
  workspaceIdentity?: string;
}) {
  const { intl } = useJiaoZhiXingIntl();
  const data = useTeachingWorkspaceData(workspacePath, workspaceIdentity);
  const updateLab = useTeachingWorkbenchStore((s) => s.updateLab);
  const setActiveLab = useTeachingWorkbenchStore((s) => s.setActiveLab);
  const addLab = useTeachingWorkbenchStore((s) => s.addLab);

  const item = useMemo(
    () =>
      data
        ? (data.labs.find((entry) => entry.id === data.activeLabId) ?? data.labs[0] ?? null)
        : null,
    [data],
  );

  if (!data || !item) {
    return (
      <div className="flex flex-col items-start gap-3 p-2">
        <p className="text-ui-base text-foreground-subtle">
          {intl.formatMessage({ id: "teaching.lab.empty" })}
        </p>
        <Button onClick={() => addLab(workspacePath, workspaceIdentity)}>
          <Plus className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.lab.create" })}
        </Button>
      </div>
    );
  }

  const patch = (partial: Partial<typeof item>) =>
    updateLab(workspacePath, workspaceIdentity, item.id, partial);

  const exportMarkdown = async () => {
    const markdown = buildLabMarkdown(item);
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
          onChange={(event) => setActiveLab(workspacePath, workspaceIdentity, event.target.value)}
          aria-label={intl.formatMessage({ id: "teaching.lab.select" })}
        >
          {data.labs.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addLab(workspacePath, workspaceIdentity)}
        >
          <Plus className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.lab.create" })}
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={() => void exportMarkdown()}>
          <Download className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.lab.export" })}
        </Button>
      </TeachingToolbar>

      <TeachingSection title={intl.formatMessage({ id: "teaching.lab.section.meta" })}>
        <div className="grid gap-3 md:grid-cols-2">
          <TeachingField
            label={intl.formatMessage({ id: "teaching.lab.field.title" })}
            fieldId="title"
          >
            <Input value={item.title} onChange={(e) => patch({ title: e.target.value })} />
          </TeachingField>
          <TeachingField
            label={intl.formatMessage({ id: "teaching.lab.field.course" })}
            fieldId="courseName"
          >
            <Input
              value={item.courseName}
              onChange={(e) => patch({ courseName: e.target.value })}
            />
          </TeachingField>
        </div>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.lab.field.objectives" })}
          fieldId="objectives"
        >
          <Textarea
            className="min-h-20"
            value={item.objectives}
            onChange={(e) => patch({ objectives: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.lab.field.principle" })}
          fieldId="principle"
        >
          <Textarea
            className="min-h-16"
            value={item.principle}
            onChange={(e) => patch({ principle: e.target.value })}
          />
        </TeachingField>
      </TeachingSection>

      <TeachingSection title={intl.formatMessage({ id: "teaching.lab.section.procedure" })}>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.lab.field.equipment" })}
          fieldId="equipment"
        >
          <Textarea
            className="min-h-16"
            value={item.equipment}
            onChange={(e) => patch({ equipment: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.lab.field.steps" })}
          fieldId="steps"
        >
          <Textarea
            className="min-h-32"
            value={item.steps}
            onChange={(e) => patch({ steps: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.lab.field.safety" })}
          fieldId="safety"
        >
          <Textarea
            className="min-h-20"
            value={item.safety}
            onChange={(e) => patch({ safety: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.lab.field.dataSheet" })}
          fieldId="dataSheet"
        >
          <Textarea
            className="min-h-28 font-mono"
            value={item.dataSheet}
            onChange={(e) => patch({ dataSheet: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.lab.field.rubric" })}
          fieldId="rubric"
        >
          <Textarea
            className="min-h-16"
            value={item.rubric}
            onChange={(e) => patch({ rubric: e.target.value })}
          />
        </TeachingField>
      </TeachingSection>
    </div>
  );
}
