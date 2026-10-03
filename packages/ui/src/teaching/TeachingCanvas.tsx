import { TEACHING_CANVAS_DEMO } from "./teachingCanvasDemo.js";
import { ArrowRight, Layers, MousePointerClick, Sparkles } from "lucide-react";
import { TeachingArtifactsPanel } from "./TeachingArtifactsPanel.js";
import { buildTeachingPanelDocument } from "./teachingContext.js";
import { useTeachingWorkspaceData } from "./useTeachingWorkspaceData.js";
import { lazy, Suspense, useEffect, useState } from "react";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { Button } from "@/components/ui/button.js";
import { MermaidBlock } from "@/components/ai-elements/mermaid-block.js";
import { MessageResponse } from "@/components/ai-elements/message.js";
import { useTeachingCanvasStore, teachingCanvasKey } from "@/store/teachingCanvasStore.js";
import { useJiaoZhiXingSessionStore } from "@/store/zcodeSessionStore.js";
import { TeachingCanvasHtml } from "./TeachingCanvasHtml.js";
import type { TeachingPanelId } from "./teachingTypes.js";
import { resolveTeachingText } from "./teachingA2ui.js";
import { normalizeTeachingMarkdown } from "./teachingMarkdown.js";
import type { TeachingComponent } from "./teachingCanvasProtocol.js";

const TeachingCanvasChart = lazy(() =>
  import("./TeachingCanvasChart.js").then((m) => ({ default: m.TeachingCanvasChart })),
);

export { TEACHING_CANVAS_DEMO } from "./teachingCanvasDemo.js";

export function TeachingCanvas({
  panelId,
  workspacePath,
  workspaceIdentity,
}: {
  panelId: TeachingPanelId;
  workspacePath: string;
  workspaceIdentity?: string;
}) {
  const data = useTeachingWorkspaceData(workspacePath, workspaceIdentity);
  const { locale } = useJiaoZhiXingIntl();
  const zh = locale.startsWith("zh");
  const key = teachingCanvasKey(workspacePath, workspaceIdentity, panelId);
  const draft = useTeachingCanvasStore((s) => s.drafts[key]);
  const ensure = useTeachingCanvasStore((s) => s.ensure);
  const [source, setSource] = useState(false);
  const [sourceText, setSourceText] = useState("");
  useEffect(() => ensure(key), [ensure, key]);
  const action = (prompt: string) => {
    const values = draft?.values ?? {};
    const fields = draft?.surface?.components
      .filter((c) => ["TextField", "Select", "Checkbox"].includes(c.component))
      .map((c) => {
        const value =
          c.component === "Checkbox"
            ? values[c.id] === "true"
              ? zh
                ? "是"
                : "Yes"
              : zh
                ? "否"
                : "No"
            : values[c.id] || "";
        return `${c.label || c.id}: ${value}`;
      })
      .join("\n");
    useJiaoZhiXingSessionStore
      .getState()
      .requestComposerTextInsert(workspacePath, `${prompt}\n\n${fields || ""}`, workspaceIdentity);
  };
  const render = (id: string): React.ReactNode => {
    const rawNode = draft?.surface?.components.find((c) => c.id === id);
    if (!rawNode || !draft?.surface) return null;
    const node = resolveTeachingText(rawNode, draft.surface);
    const children = node.children?.map((child) => (
      <div key={child} className="min-w-0 flex-1">
        {render(child)}
      </div>
    ));
    switch (node.component) {
      case "Grid":
        return (
          <div className="jzx-a2ui-grid" data-columns={node.columns ?? 2}>
            {children}
          </div>
        );
      case "Heading":
        return node.level === 1 ? (
          <h2 className="text-ui-xl font-semibold tracking-tight">{node.text}</h2>
        ) : node.level === 3 ? (
          <h4 className="text-ui-base font-medium">{node.text}</h4>
        ) : (
          <h3 className="text-ui-lg font-semibold">{node.text}</h3>
        );
      case "Badge":
        return (
          <span
            className="jzx-a2ui-badge inline-flex rounded-full border px-3 py-1 text-ui-xs"
            data-tone={node.tone ?? "info"}
          >
            {node.label || node.text}
          </span>
        );
      case "Stat":
        return (
          <section
            className="jzx-a2ui-stat rounded-xl border border-border p-4"
            data-tone={node.tone ?? "info"}
          >
            <p className="text-ui-sm text-foreground-subtle">{node.label}</p>
            <p className="my-2 text-ui-xl font-semibold tabular-nums">{node.value}</p>
            <p className="text-ui-xs text-foreground-subtle">{node.description}</p>
          </section>
        );
      case "Progress":
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-ui-sm">
              <span>{node.label}</span>
              <span>{node.value}%</span>
            </div>
            <progress
              className="jzx-a2ui-progress h-2 w-full"
              value={Number(node.value)}
              max={100}
              aria-label={node.label}
            />
          </div>
        );
      case "Divider":
        return <hr className="border-border" />;
      case "Select":
        return (
          <label className="flex flex-col gap-2 text-ui-sm">
            {node.label}
            <select
              className="rounded-lg border border-input-border bg-input px-3 py-2"
              value={draft?.values[node.id] ?? ""}
              onChange={(e) =>
                useTeachingCanvasStore.getState().setValue(key, node.id, e.target.value)
              }
            >
              <option value="" disabled>
                {zh ? "请选择" : "Select an option"}
              </option>
              {node.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        );
      case "Checkbox":
        return (
          <label className="flex items-center gap-2 text-ui-sm">
            <input
              type="checkbox"
              className="size-4 accent-brand"
              checked={draft?.values[node.id] === "true"}
              onChange={(e) =>
                useTeachingCanvasStore.getState().setValue(key, node.id, String(e.target.checked))
              }
            />
            {node.label}
          </label>
        );
      case "ECharts":
        return (
          <Suspense
            fallback={
              <p className="text-ui-sm text-foreground-subtle">
                {zh ? "正在绘制教学图表…" : "Drawing teaching chart…"}
              </p>
            }
          >
            <TeachingCanvasChart node={node} onAction={action} />
          </Suspense>
        );
      case "Row":
        return <div className="flex flex-wrap gap-3">{children}</div>;
      case "Column":
        return <div className="flex flex-col gap-4">{children}</div>;
      case "Card":
        return (
          <section
            className="jzx-a2ui-card space-y-3 rounded-xl border border-border bg-card p-4"
            data-tone={node.tone ?? "default"}
          >
            {node.label && <h3 className="text-ui-lg font-semibold">{node.label}</h3>}
            {node.description && (
              <p className="text-ui-sm text-foreground-subtle">{node.description}</p>
            )}
            {children}
          </section>
        );
      case "Mermaid":
        return <MermaidBlock code={node.code || ""} />;
      case "Markdown":
        return (
          <MessageResponse>
            {normalizeTeachingMarkdown(node.text || node.content || "")}
          </MessageResponse>
        );
      case "Formula":
        return (
          <MessageResponse>
            {node.displayMode === false
              ? "$" + (node.latex || "") + "$"
              : "\n$$\n" + (node.latex || "") + "\n$$\n"}
          </MessageResponse>
        );
      case "Html":
        return <TeachingCanvasHtml html={node.html || ""} onAction={action} />;
      case "Button":
        return (
          <Button
            className="jzx-a2ui-action"
            variant="outline"
            onClick={() => action(node.prompt!)}
          >
            {node.label || (zh ? "继续" : "Continue")}
          </Button>
        );
      case "TextField":
        return (
          <label className="flex flex-col gap-2 text-ui-sm">
            {node.label}
            <input
              className="rounded-lg border border-input-border bg-input px-3 py-2"
              value={draft?.values[node.id] || ""}
              onChange={(e) =>
                useTeachingCanvasStore.getState().setValue(key, node.id, e.target.value)
              }
            />
          </label>
        );
      case "Table":
        return <CanvasTable node={node} />;
      default:
        return <p className="whitespace-pre-wrap text-ui-sm leading-relaxed">{node.text}</p>;
    }
  };
  return (
    <div>
      <section
        data-testid="teaching-canvas"
        className="jzx-canvas-studio mb-4 rounded-xl border border-border bg-card p-4"
      >
        <div
          className="jzx-canvas-orbit mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-accent p-3 text-ui-xs"
          data-testid="teaching-interaction-trail"
        >
          <Sparkles className="size-4 text-brand" />
          <span>{zh ? "对话生成" : "Generate"}</span>
          <ArrowRight className="size-3 text-brand" />
          <Layers className="size-4 text-brand" />
          <span>{zh ? "画布更新" : "Canvas update"}</span>
          <ArrowRight className="size-3 text-brand" />
          <MousePointerClick className="size-4 text-brand" />
          <span>{zh ? "点击交互" : "Interact"}</span>
          <ArrowRight className="size-3 text-brand" />
          <span>{zh ? "产物预览" : "Preview"}</span>
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-ui-sm font-medium">
            {draft?.surface?.title || (zh ? "智能画布" : "Smart canvas")}
          </h2>
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSource(!source);
                setSourceText("```jzx-ui\n" + JSON.stringify(draft?.surface, null, 2) + "\n```");
              }}
            >
              {zh ? "源代码" : "Source"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!draft?.canUndo}
              onClick={() => useTeachingCanvasStore.getState().undo(key)}
            >
              {zh ? "撤销画布" : "Undo canvas"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!draft?.surface}
              onClick={() => useTeachingCanvasStore.getState().clear(key)}
            >
              {zh ? "清空画布" : "Clear canvas"}
            </Button>
          </div>
        </div>
        {draft?.error ? (
          <p role="alert" className="mb-3 text-ui-sm text-destructive">
            {zh
              ? "生成界面格式无效，已保留原画布。请让智能体修正完整组件树。"
              : "Invalid UI response; previous canvas retained. Ask the agent to correct the complete tree."}
          </p>
        ) : null}
        {!draft?.surface ? (
          <div className="flex flex-col gap-3">
            {data && (
              <div
                className="jzx-teaching-document rounded-lg bg-surface p-4"
                data-testid="teaching-draft-document"
              >
                <MessageResponse>
                  {normalizeTeachingMarkdown(buildTeachingPanelDocument(panelId, data, locale))}
                </MessageResponse>
              </div>
            )}
            <p className="text-ui-sm text-foreground-subtle">
              {zh
                ? "让右侧智能体生成互动页面、流程图或教学卡片，完成后自动展示在这里。"
                : "Ask the agent for an interactive UI, diagram or teaching card. Completed output appears here."}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                useTeachingCanvasStore
                  .getState()
                  .receive(key, `example-${crypto.randomUUID()}`, TEACHING_CANVAS_DEMO)
              }
            >
              {zh ? "查看互动示例（非模型生成）" : "Load interactive example (not AI generated)"}
            </Button>
          </div>
        ) : source ? (
          <div className="flex flex-col gap-3">
            <textarea
              aria-label={zh ? "画布源代码" : "Canvas source"}
              className="min-h-64 w-full rounded-lg border border-input-border bg-input p-3 font-mono text-ui-xs"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              maxLength={100000}
            />
            <Button
              size="sm"
              onClick={() => {
                useTeachingCanvasStore
                  .getState()
                  .receive(key, `manual-${crypto.randomUUID()}`, sourceText);
                setSource(false);
              }}
            >
              {zh ? "更新画布" : "Update canvas"}
            </Button>
          </div>
        ) : (
          render("root")
        )}
        {draft?.document && (
          <div
            className="jzx-teaching-document mt-4 border-t border-border pt-4"
            data-testid="teaching-generated-document"
          >
            <MessageResponse>{normalizeTeachingMarkdown(draft.document)}</MessageResponse>
          </div>
        )}
      </section>
      <TeachingArtifactsPanel
        panelId={panelId}
        workspacePath={workspacePath}
        workspaceIdentity={workspaceIdentity}
      />
    </div>
  );
}
function CanvasTable({ node }: { node: TeachingComponent }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-ui-sm">
        <thead>
          <tr>
            {(Array.isArray(node.columns) ? node.columns : [])?.map((c, i) => (
              <th key={i} className="border-b border-border p-2">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {node.rows?.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j} className="border-b border-border p-2">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
