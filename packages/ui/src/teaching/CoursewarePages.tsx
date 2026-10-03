import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";
import { MessageResponse } from "@/components/ai-elements/message.js";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { TeachingField, TeachingSection } from "./TeachingFormPrimitives.js";
import { normalizeTeachingMarkdown } from "./teachingMarkdown.js";
import type { TeachingCoursewarePage } from "./teachingTypes.js";

export function CoursewarePages({
  slides,
  onChange,
}: {
  slides: TeachingCoursewarePage[];
  onChange: (slides: TeachingCoursewarePage[]) => void;
}) {
  const { intl } = useJiaoZhiXingIntl();
  const label = (key: string) => intl.formatMessage({ id: `teaching.courseware.${key}` });
  const patch = (index: number, value: Partial<TeachingCoursewarePage>) =>
    onChange(slides.map((page, i) => (i === index ? { ...page, ...value } : page)));
  return (
    <TeachingSection title={label("pages")}>
      <p className="text-ui-sm text-foreground-subtle">{label("previewHint")}</p>
      {slides.length === 0 && <p className="text-ui-base">{label("outlineOnly")}</p>}
      {slides.map((page, index) => (
        <details
          key={index}
          open={index === 0}
          className="rounded-lg border border-border p-3"
          data-testid="courseware-page"
        >
          <summary className="cursor-pointer text-ui-base font-medium">
            {index + 1}. {page.title}
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <TeachingField label={label("field.title")} fieldId={`slide-title-${index}`}>
              <Input
                aria-label={`${label("field.title")} ${index + 1}`}
                value={page.title}
                maxLength={120}
                onChange={(e) => patch(index, { title: e.target.value })}
              />
            </TeachingField>
            <TeachingField label={label("body")} fieldId={`slide-body-${index}`}>
              <Textarea
                aria-label={`${label("body")} ${index + 1}`}
                value={page.body}
                maxLength={3000}
                className="min-h-32"
                onChange={(e) => patch(index, { body: e.target.value })}
              />
            </TeachingField>
            <TeachingField label={label("notes")} fieldId={`slide-notes-${index}`}>
              <Textarea
                aria-label={`${label("notes")} ${index + 1}`}
                value={page.notes}
                maxLength={6000}
                onChange={(e) => patch(index, { notes: e.target.value })}
              />
            </TeachingField>
            <div
              className="min-w-0 overflow-x-auto rounded-md bg-surface p-4"
              data-testid="courseware-page-preview"
            >
              <h3 className="mb-3 text-ui-lg font-medium">{page.title}</h3>
              <MessageResponse>{normalizeTeachingMarkdown(page.body)}</MessageResponse>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange(slides.filter((_, i) => i !== index))}
            >
              {label("removePage")}
            </Button>
          </div>
        </details>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={slides.length >= 80}
        data-testid="courseware-add-page"
        onClick={() => onChange([...slides, { title: label("newPage"), body: "", notes: "" }])}
      >
        {label("addPage")}
      </Button>
    </TeachingSection>
  );
}
