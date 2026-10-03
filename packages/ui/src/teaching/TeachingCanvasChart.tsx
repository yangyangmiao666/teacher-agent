import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { useJiaoZhiXingIntl } from "@/i18n/IntlProvider.js";
import { useJiaoZhiXingStore } from "@/store/StoreProvider.js";
import { resolveTheme } from "@/useTheme.js";
import { teachingChartRenderOption } from "./teachingChartOptions.js";
import type { TeachingComponent } from "./teachingCanvasSchema.js";

export function TeachingCanvasChart({
  node,
  onAction,
}: {
  node: TeachingComponent;
  onAction: (prompt: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const action = useRef(onAction);
  action.current = onAction;
  const { locale } = useJiaoZhiXingIntl();
  const theme = useJiaoZhiXingStore((s) => s.theme);
  const dark = resolveTheme(theme) === "dark";
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!host.current || !node.option) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const chart = echarts.init(host.current, dark ? "dark" : undefined, { renderer: "svg" });
    const update = () => {
      try {
        chart.setOption(teachingChartRenderOption(node.option!, motion.matches), {
          notMerge: true,
        });
        setError(false);
      } catch {
        setError(true);
      }
    };
    update();
    motion.addEventListener("change", update);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(host.current);
    if (node.prompt)
      chart.on("click", (event: unknown) => {
        if (!event || typeof event !== "object") return;
        const item = event as Record<string, unknown>;
        const labels = locale.startsWith("zh")
          ? ["数据系列", "数据项", "数值"]
          : ["Series", "Data item", "Value"];
        const detail = ["seriesName", "name", "value"]
          .map((key, index) => `${labels[index]}: ${String(item[key] ?? "").slice(0, 500)}`)
          .join("\n");
        action.current(`${node.prompt}\n${detail}`);
      });
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", update);
      chart.dispose();
    };
  }, [node.option, node.prompt, node.height, dark, locale]);
  return (
    <figure
      className="jzx-a2ui-chart min-w-0 rounded-xl border border-border bg-surface p-3"
      data-testid="teaching-echarts"
    >
      {node.label && (
        <figcaption className="mb-2 text-ui-base font-medium">{node.label}</figcaption>
      )}
      <div
        ref={host}
        role="img"
        aria-label={
          node.label || (locale.startsWith("zh") ? "教学互动图表" : "Interactive teaching chart")
        }
        style={{ height: node.height ?? 360, width: "100%" }}
      />
      {node.description && (
        <p className="mt-2 text-ui-sm text-foreground-subtle">{node.description}</p>
      )}
      {node.prompt && (
        <p className="mt-2 text-ui-xs text-brand">
          {locale.startsWith("zh")
            ? "点击数据项，将分析问题带到右侧智能体"
            : "Click a data point to ask the agent"}
        </p>
      )}
      {error && (
        <p role="alert" className="text-ui-sm text-destructive">
          {locale.startsWith("zh")
            ? "图表配置无法渲染，请让智能体修正。"
            : "Chart could not render. Ask the agent to correct the option."}
        </p>
      )}
    </figure>
  );
}
