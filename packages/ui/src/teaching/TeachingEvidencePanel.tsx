import { useEffect, useMemo } from "react";
import { Download, Eraser, ScrollText } from "lucide-react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { toast } from "@/components/ui/toast.js";
import {
  teachingWorkspaceKey,
  useTeachingEvidenceStore,
  type TeachingEvidenceEvent,
} from "@/store/teachingEvidenceStore.js";

// 工作区尚未写入内存时，选择器若每次 `?? []` 都会得到新数组。
// useSyncExternalStore 会把每次新引用当成快照变化，触发无限重渲染。
// 这里用模块级常量兜底；真正的时间线仍由 list() 从 localStorage 灌入 store。
const EMPTY_EVENTS: TeachingEvidenceEvent[] = [];

export function TeachingEvidencePanel({
  workspacePath,
  workspaceIdentity,
}: {
  workspacePath: string;
  workspaceIdentity?: string;
}) {
  const { intl, locale } = useJiaoZhiXingIntl();
  const key = teachingWorkspaceKey(workspacePath, workspaceIdentity);
  const clear = useTeachingEvidenceStore((s) => s.clear);
  const exportMarkdown = useTeachingEvidenceStore((s) => s.exportMarkdown);
  const record = useTeachingEvidenceStore((s) => s.record);
  const list = useTeachingEvidenceStore((s) => s.list);
  const events = useTeachingEvidenceStore((s) => s.eventsByWorkspace[key] ?? EMPTY_EVENTS);
  // 只在工作区 key 变化时灌入已保存佐证；list 在已有缓存时不再 setState。
  useEffect(() => {
    list(key);
  }, [key, list]);
  const ordered = useMemo(() => events.slice().reverse(), [events]);

  const handleExport = async () => {
    const markdown = exportMarkdown(key, locale);
    record({
      workspaceKey: key,
      kind: "export",
      summary: intl.formatMessage({ id: "teaching.evidence.exportedEvent" }),
    });
    try {
      await navigator.clipboard.writeText(markdown);
      toast(intl.formatMessage({ id: "teaching.evidence.exported" }));
    } catch {
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "教智星-建设佐证时间线.md";
      a.click();
      URL.revokeObjectURL(url);
      toast(intl.formatMessage({ id: "teaching.evidence.downloaded" }));
    }
  };

  return (
    <section
      className="jzx-evidence-panel flex min-h-0 flex-col gap-2 rounded-xl border border-border bg-card/80 p-3"
      data-testid="teaching-evidence-panel"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-ui-sm font-medium">
            <ScrollText className="size-3.5 text-brand" aria-hidden />
            {intl.formatMessage({ id: "teaching.evidence.title" })}
          </div>
          <p className="text-ui-xs text-foreground-subtlest">
            {intl.formatMessage({ id: "teaching.evidence.subtitle" })}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => void handleExport()}>
            <Download className="size-3.5" aria-hidden />
            {intl.formatMessage({ id: "teaching.evidence.export" })}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              clear(key);
              toast(intl.formatMessage({ id: "teaching.evidence.cleared" }));
            }}
            disabled={ordered.length === 0}
          >
            <Eraser className="size-3.5" aria-hidden />
            {intl.formatMessage({ id: "teaching.evidence.clear" })}
          </Button>
        </div>
      </header>
      <ul className="jzx-evidence-list max-h-48 space-y-2 overflow-y-auto pr-1">
        {ordered.length === 0 ? (
          <li className="text-ui-caption text-foreground-subtle">
            {intl.formatMessage({ id: "teaching.evidence.empty" })}
          </li>
        ) : (
          ordered.map((event) => (
            <li
              key={event.id}
              className="rounded-md border border-border/80 bg-surface/60 px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-ui-caption font-medium">{event.summary}</span>
                <span className="shrink-0 text-ui-xs text-foreground-subtlest">
                  {new Date(event.at).toLocaleTimeString(
                    locale.startsWith("zh") ? "zh-CN" : "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
              <div className="mt-0.5 truncate text-ui-xs text-foreground-subtlest">
                {event.kind}
                {event.skill ? ` · $${event.skill}` : ""}
                {event.knowledgeLabel ? ` · ${event.knowledgeLabel}` : ""}
                {event.fields?.length ? ` · ${event.fields.length} fields` : ""}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
