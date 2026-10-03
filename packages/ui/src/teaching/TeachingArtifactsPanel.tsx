import { resolveTheme } from "@/useTheme.js";
import { useJiaoZhiXingStore } from "@/store/StoreProvider.js";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Download, FileText, Presentation, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button.js";
import { PptxPreviewContent } from "@/previewPanePptxContent.js";
import { PreviewPaneOfficeContent } from "@/previewPaneOfficeContent.js";
import { MessageResponse } from "@/components/ai-elements/message.js";
import { usePptxViewerLabels, usePdfViewerLabels } from "@/hooks/usePreviewViewerLabels.js";
import { useTeachingArtifactBytes, useTeachingArtifacts } from "@/hooks/useTeachingArtifacts.js";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { teachingCanvasKey, useTeachingCanvasStore } from "@/store/teachingCanvasStore.js";
import { getOfficeFilePreviewKind } from "@/lib/officeFilePreview.js";
import type { TeachingPanelId } from "./teachingTypes.js";
import { TeachingCanvasHtml } from "./TeachingCanvasHtml.js";
import { normalizeTeachingMarkdown } from "./teachingMarkdown.js";
import { useJiaoZhiXingSessionStore } from "@/store/zcodeSessionStore.js";

const PdfViewer = lazy(() =>
  import("@/components/ui/pdf-viewer.js").then((m) => ({ default: m.PdfViewer })),
);
export function TeachingArtifactsPanel({
  panelId,
  workspacePath,
  workspaceIdentity,
}: {
  panelId: TeachingPanelId;
  workspacePath: string;
  workspaceIdentity?: string;
}) {
  const { locale } = useJiaoZhiXingIntl();
  const theme = useJiaoZhiXingStore((state) => state.theme);
  const zh = locale.startsWith("zh");
  const key = teachingCanvasKey(workspacePath, workspaceIdentity, panelId);
  const draft = useTeachingCanvasStore((s) => s.drafts[key]);
  const artifact = draft?.artifacts.find((item) => item.id === draft.selectedArtifactId);
  const { data, preview, error } = useTeachingArtifactBytes(key, artifact, workspacePath);
  const { refresh, loading } = useTeachingArtifacts(panelId, workspacePath, workspaceIdentity);
  const pptxLabels = usePptxViewerLabels();
  const pdfLabels = usePdfViewerLabels();
  const [objectUrl, setObjectUrl] = useState("");
  useEffect(() => {
    if (!data) {
      setObjectUrl("");
      return;
    }
    const url = URL.createObjectURL(new Blob([data]));
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [data]);
  const text = useMemo(
    () =>
      data && /\.(md|html?)$/i.test(artifact?.name ?? "") ? new TextDecoder().decode(data) : "",
    [data, artifact?.name],
  );
  const select = (id: string | null) => useTeachingCanvasStore.getState().selectArtifact(key, id);
  return (
    <section
      className="jzx-artifact-gallery mt-4 rounded-xl border border-border bg-card p-4"
      data-testid="teaching-artifacts"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-ui-base font-medium">{zh ? "教学产物" : "Teaching artifacts"}</h2>
          <p className="text-ui-xs text-foreground-subtle">
            {zh
              ? "实际文件 · 左侧预览 · 原文件下载"
              : "Actual files · Canvas preview · Download originals"}
          </p>
        </div>
        <Button size="sm" variant="ghost" disabled={loading} onClick={() => void refresh()}>
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
          {zh ? "刷新产物" : "Refresh"}
        </Button>
      </div>
      {!draft?.artifacts.length && (
        <p className="text-ui-sm text-foreground-subtle">
          {zh
            ? "智能体写入 outputs 的教学文件和本地生成的 PPT 会展示在这里。"
            : "Agent outputs and locally generated PPT files appear here."}
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {draft?.artifacts.map((item) => (
          <button
            key={item.id}
            onClick={() => select(item.id)}
            aria-pressed={item.id === artifact?.id}
            className="jzx-artifact-tile flex min-w-0 items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left transition hover:border-brand"
            data-testid="teaching-artifact-tile"
          >
            {/\.pptx$/i.test(item.name) ? (
              <Presentation className="size-6 shrink-0 text-brand" />
            ) : (
              <FileText className="size-6 shrink-0 text-brand" />
            )}
            <div className="min-w-0">
              <span className="block truncate text-ui-base font-medium">{item.name}</span>
              <span className="block truncate text-ui-xs text-foreground-subtle">
                {item.source === "local"
                  ? zh
                    ? "本地生成 · 已保存"
                    : "Generated · Saved"
                  : item.path}
              </span>
            </div>
          </button>
        ))}
      </div>
      {artifact && (
        <div
          className="mt-4 min-w-0 rounded-lg border border-border"
          data-testid="teaching-artifact-preview"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-2">
            <span className="min-w-0 truncate text-ui-sm font-medium">{artifact.name}</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={!data}
                onClick={() => {
                  if (!data) return;
                  const url = URL.createObjectURL(new Blob([data]));
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = artifact.name;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="size-3.5" />
                {zh ? "下载文件" : "Download"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={zh ? "关闭产物预览" : "Close preview"}
                onClick={() => select(null)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
          {error ? (
            <p role="alert" className="p-3 text-ui-sm text-destructive">
              {zh
                ? "文件不可读取、缓存缺失或超过20MiB。请刷新产物或重新生成。"
                : "File unavailable, cache missing or above 20MiB. Refresh or regenerate."}
            </p>
          ) : !data ? (
            <p className="p-3 text-ui-sm">{zh ? "正在读取产物…" : "Loading artifact…"}</p>
          ) : (
            <div className="min-w-0 overflow-hidden p-2">
              {/\.pptx$/i.test(artifact.name) ? (
                <div className="h-[540px] min-w-0">
                  <PptxPreviewContent data={data} fileName={artifact.name} labels={pptxLabels} />
                </div>
              ) : /\.pdf$/i.test(artifact.name) ? (
                <Suspense fallback={<p>{pdfLabels.loading}</p>}>
                  <PdfViewer
                    className="h-[540px]"
                    source={new Uint8Array(data)}
                    labels={pdfLabels}
                  />
                </Suspense>
              ) : getOfficeFilePreviewKind(artifact.name) && preview ? (
                <PreviewPaneOfficeContent
                  kind={getOfficeFilePreviewKind(artifact.name)!}
                  sourcePath={artifact.path!}
                  preview={preview}
                  loading={false}
                  error={null}
                  resolvedTheme={resolveTheme(theme)}
                />
              ) : /\.md$/i.test(artifact.name) ? (
                <MessageResponse>{normalizeTeachingMarkdown(text)}</MessageResponse>
              ) : /\.html?$/i.test(artifact.name) ? (
                <TeachingCanvasHtml
                  html={text}
                  onAction={(prompt) =>
                    useJiaoZhiXingSessionStore
                      .getState()
                      .requestComposerTextInsert(workspacePath, prompt, workspaceIdentity)
                  }
                />
              ) : /\.(svg|png|jpe?g|webp)$/i.test(artifact.name) ? (
                <img className="max-w-full" src={objectUrl} alt={artifact.name} />
              ) : (
                <p className="text-ui-sm">
                  {zh ? "请下载原文件查看。" : "Download the original file to view."}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
