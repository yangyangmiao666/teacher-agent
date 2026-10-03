const seriesTypes = new Set([
  "bar",
  "line",
  "pie",
  "scatter",
  "effectScatter",
  "radar",
  "gauge",
  "heatmap",
  "graph",
  "sankey",
  "funnel",
  "boxplot",
  "candlestick",
  "tree",
  "treemap",
  "sunburst",
  "parallel",
  "pictorialBar",
  "themeRiver",
]);
/** 模型图表只接收有界JSON与内置图形，禁止外链图片和可执行配置。 */
export function isTeachingChartOption(option: Record<string, unknown>): boolean {
  let count = 0;
  const visit = (value: unknown, depth: number): boolean => {
    if (++count > 10000 || depth > 16) return false;
    if (value === null || typeof value === "boolean") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "string")
      return (
        value.length <= 10000 &&
        !/(?:https?:|data:|javascript:|file:|image:\/\/|\/\/)/iu.test(value)
      );
    if (Array.isArray(value)) return value.every((v) => visit(v, depth + 1));
    if (value && typeof value === "object")
      return Object.entries(value).every(
        ([key, v]) =>
          !["__proto__", "prototype", "constructor"].includes(key) && visit(v, depth + 1),
      );
    return false;
  };
  try {
    const series = Array.isArray(option.series) ? option.series : [option.series];
    return (
      JSON.stringify(option).length <= 30000 &&
      visit(option, 0) &&
      series.length > 0 &&
      series.length <= 20 &&
      series.every((item) => item && typeof item === "object" && seriesTypes.has(String(item.type)))
    );
  } catch {
    return false;
  }
}
/** 统一覆盖嵌套tooltip，避免series自己的tooltip重新启用HTML解释。 */
export function teachingChartRenderOption(
  option: Record<string, unknown>,
  reducedMotion: boolean,
): Record<string, unknown> {
  const sanitize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sanitize);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, v]) => [
          key,
          key === "tooltip"
            ? {
                ...(v && typeof v === "object" && !Array.isArray(v) ? v : {}),
                renderMode: "richText",
              }
            : sanitize(v),
        ]),
      );
    return value;
  };
  return {
    ...(sanitize(option) as Record<string, unknown>),
    backgroundColor: "transparent",
    tooltip: { ...(option.tooltip as object), renderMode: "richText" },
    animation: !reducedMotion,
    animationDuration: 600,
  };
}
