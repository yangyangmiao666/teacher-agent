import { useMemo } from "react";
import { Download, Plus } from "lucide-react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";
import { toast } from "@/components/ui/toast.js";
import { buildCaseMarkdown } from "@/teaching/teachingSeed.js";
import {
  TeachingField,
  TeachingSection,
  TeachingToolbar,
} from "@/teaching/TeachingFormPrimitives.js";
import { useTeachingWorkspaceData } from "@/teaching/useTeachingWorkspaceData.js";
import { useTeachingWorkbenchStore } from "@/store/teachingWorkbenchStore.js";

export function CaseLibrary({
  workspacePath,
  workspaceIdentity,
}: {
  workspacePath: string;
  workspaceIdentity?: string;
}) {
  const { intl } = useJiaoZhiXingIntl();
  const data = useTeachingWorkspaceData(workspacePath, workspaceIdentity);
  const updateCase = useTeachingWorkbenchStore((s) => s.updateCase);
  const setActiveCase = useTeachingWorkbenchStore((s) => s.setActiveCase);
  const addCase = useTeachingWorkbenchStore((s) => s.addCase);

  const item = useMemo(
    () =>
      data
        ? (data.cases.find((entry) => entry.id === data.activeCaseId) ?? data.cases[0] ?? null)
        : null,
    [data],
  );

  if (!data || !item) {
    return (
      <div className="flex flex-col items-start gap-3 p-2">
        <p className="text-ui-base text-foreground-subtle">
          {intl.formatMessage({ id: "teaching.case.empty" })}
        </p>
        <Button onClick={() => addCase(workspacePath, workspaceIdentity)}>
          <Plus className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.case.create" })}
        </Button>
      </div>
    );
  }

  const patch = (partial: Partial<typeof item>) =>
    updateCase(workspacePath, workspaceIdentity, item.id, partial);

  const exportMarkdown = async () => {
    const markdown = buildCaseMarkdown(item);
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
          onChange={(event) => setActiveCase(workspacePath, workspaceIdentity, event.target.value)}
          aria-label={intl.formatMessage({ id: "teaching.case.select" })}
        >
          {data.cases.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addCase(workspacePath, workspaceIdentity)}
        >
          <Plus className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.case.create" })}
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={() => void exportMarkdown()}>
          <Download className="size-3.5" aria-hidden />
          {intl.formatMessage({ id: "teaching.case.export" })}
        </Button>
      </TeachingToolbar>

      <TeachingSection title={intl.formatMessage({ id: "teaching.case.section.meta" })}>
        <div className="grid gap-3 md:grid-cols-2">
          <TeachingField
            label={intl.formatMessage({ id: "teaching.case.field.title" })}
            fieldId="title"
          >
            <Input value={item.title} onChange={(e) => patch({ title: e.target.value })} />
          </TeachingField>
          <TeachingField
            label={intl.formatMessage({ id: "teaching.case.field.course" })}
            fieldId="courseName"
          >
            <Input
              value={item.courseName}
              onChange={(e) => patch({ courseName: e.target.value })}
            />
          </TeachingField>
          <TeachingField
            label={intl.formatMessage({ id: "teaching.case.field.knowledge" })}
            fieldId="knowledgeLabel"
          >
            <Input
              value={item.knowledgeLabel}
              onChange={(e) => patch({ knowledgeLabel: e.target.value })}
            />
          </TeachingField>
        </div>
      </TeachingSection>

      <TeachingSection title={intl.formatMessage({ id: "teaching.case.section.body" })}>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.case.field.background" })}
          fieldId="background"
        >
          <Textarea
            className="min-h-24"
            value={item.background}
            onChange={(e) => patch({ background: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.case.field.problem" })}
          fieldId="problem"
        >
          <Textarea
            className="min-h-20"
            value={item.problem}
            onChange={(e) => patch({ problem: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.case.field.analysis" })}
          fieldId="analysis"
        >
          <Textarea
            className="min-h-24"
            value={item.analysis}
            onChange={(e) => patch({ analysis: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.case.field.discussion" })}
          fieldId="discussion"
        >
          <Textarea
            className="min-h-20"
            value={item.discussion}
            onChange={(e) => patch({ discussion: e.target.value })}
          />
        </TeachingField>
        <TeachingField
          label={intl.formatMessage({ id: "teaching.case.field.desensitization" })}
          fieldId="desensitization"
        >
          <Textarea
            className="min-h-16"
            value={item.desensitization}
            onChange={(e) => patch({ desensitization: e.target.value })}
          />
        </TeachingField>
      </TeachingSection>
    </div>
  );
}
