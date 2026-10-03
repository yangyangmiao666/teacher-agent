import { teachingResponseDocument } from "./teachingResponseDocument.js";
import { teachingSurfaceSchema, type TeachingSurface } from "./teachingCanvasSchema.js";
import { applyTeachingA2ui } from "./teachingA2ui.js";
export { teachingSurfaceSchema } from "./teachingCanvasSchema.js";
export type { TeachingSurface, TeachingComponent } from "./teachingCanvasSchema.js";

/** 完成态正文 → 原子画布；普通正文渲染为 Markdown，空正文返回 null。 */
export function parseTeachingSurface(
  source: string,
  current?: TeachingSurface | null,
): TeachingSurface | null {
  const fences = [
    ...source.matchAll(
      /^```(jzx-ui|a2ui|mermaid|echarts|html|markdown|md)[ \t]*\r?\n([\s\S]*?)^```[ \t]*\r?$/gimu,
    ),
  ];
  if (!source.trim()) return null;
  if (source.length > 100000) throw new Error("Canvas response exceeds 100KB");
  const structured = fences.find((f) => ["jzx-ui", "a2ui"].includes(f[1]!.toLowerCase()));
  if (structured) {
    const value: unknown = JSON.parse(structured[2]!);
    if (Array.isArray(value)) return applyTeachingA2ui(value, current);
    if (value && typeof value === "object" && "a2ui_operations" in value)
      return applyTeachingA2ui(value.a2ui_operations, current);
    return teachingSurfaceSchema.parse(value);
  }
  if (!fences.length)
    return teachingSurfaceSchema.parse({
      title: "教学文档 / Teaching document",
      components: [{ id: "root", component: "Markdown", text: teachingResponseDocument(source) }],
    });
  const remainder = teachingResponseDocument(
    source.replace(
      /^```(?:mermaid|echarts|html|markdown|md)[ \t]*\r?\n[\s\S]*?^```[ \t]*\r?$/gim,
      "",
    ),
  );
  return teachingSurfaceSchema.parse({
    title: "教学可视化 / Teaching visualization",
    components: [
      {
        id: "root",
        component: "Column",
        children: [...(remainder ? ["document"] : []), ...fences.map((_, i) => `visual-${i}`)],
      },
      ...(remainder ? [{ id: "document", component: "Markdown", text: remainder }] : []),
      ...fences.map((f, i) => ({
        id: `visual-${i}`,
        component:
          f[1]!.toLowerCase() === "echarts"
            ? "ECharts"
            : f[1]!.toLowerCase() === "html"
              ? "Html"
              : ["md", "markdown"].includes(f[1]!.toLowerCase())
                ? "Markdown"
                : "Mermaid",
        ...(f[1]!.toLowerCase() === "echarts"
          ? { option: JSON.parse(f[2]!) }
          : f[1]!.toLowerCase() === "html"
            ? { html: f[2] }
            : ["md", "markdown"].includes(f[1]!.toLowerCase())
              ? { text: f[2] }
              : { code: f[2] }),
      })),
    ],
  });
}

export const TEACHING_CANVAS_INSTRUCTIONS = `\n[教智星智能画布 / Teaching canvas]\n需要左侧 UI 时输出完整的 \`\`\`jzx-ui JSON 围栏：{"title":"标题","components":[{"id":"root","component":"Column","children":["t","b"]},{"id":"t","component":"Text","text":"内容"},{"id":"b","component":"Button","label":"继续完善","prompt":"请完善当前内容"}]}。目录 Column/Row/Card(children 为组件 id 数组，Card可加label,description,tone), Grid(children,columns:1..4), Text/Markdown(text或content，支持 $...$、$$...$$ 数学公式), Formula(latex,displayMode), Mermaid(code), Html(html), Table(columns 字符串数组、rows 二维数组), TextField(label), Select(label,options字符串数组), Checkbox(label), Button(label,prompt), Heading(text,level:1..3), Badge(label,tone), Stat(label,value,description,tone), Progress(label,value:0..100), Divider, ECharts(option标准JSON对象,height:240..640,label,description,prompt可选)。tone为default/info/success/warning。唯一 id、root 根，jzx-ui 完整替换。原生 a2ui 围栏使用 {a2ui_operations:[{version:"v0.9",createSurface:{surfaceId:"teaching",catalogId:"jzx-teaching"}},{version:"v0.9",updateComponents:{surfaceId:"teaching",components:[...]}}]}；后续可只发 updateComponents 按 id 更新或 updateDataModel 的 path/value；Text/Markdown.text 支持 {path:"/topic"} 数据绑定。也可直接输出 mermaid/html/echarts 围栏（echarts围栏仅含option JSON，必须有series与type）。ECharts支持bar,line,pie,scatter,radar,gauge,heatmap,graph,sankey等内置图形；不含函数、外部URL/图片，tooltip由系统渲染。图表prompt使数据项点击回传。HTML 使用内联 CSS，无外网和自定义 JS；按钮或 form 使用 data-jzx-prompt="下一步问题" 回传，form 内 input 使用 name 字段。教学字段仍输出对应 jzx-* 围栏，与 UI 围栏可同时提供。`;

export const TEACHING_ARTIFACT_INSTRUCTIONS =
  '\n[教学产物 / Teaching artifacts] 所有教学正文应展示在左侧画布。优先生成含教学内容和操作按钮的 jzx-ui/A2UI 卡片、公式、表格与 Mermaid 流程；按钮将后续问题回传。不要只在对话中描述界面。生成实际 PPTX/Word/Excel/PDF 等文件后，附 ```jzx-artifacts JSON 围栏：{"artifacts":[{"path":"outputs/office/课件.pptx","name":"完整教学课件.pptx"}]}。路径为当前工作区内真实已写入文件，不能伪造或使用外网URL。输出 jzx-courseware slides 时可在左侧直接生成PPT产物并预览。';

export const TEACHING_VISUAL_DESIGN_INSTRUCTIONS = `\n[教学展示设计] 将完整教学内容组织为可互动的左侧页面：优先提供一个jzx-ui或原生A2UI页面，以Heading+Badge建立主题与数据来源标记，用Grid+Stat呈现关键指标或学习目标，Card分区承载案例/公式/解释。流程和知识结构用Mermaid，真实数据对比/趋势/构成/关系用ECharts，选合适图型并带名称、单位、范围与简短结论。搭配Select/Checkbox/TextField和带prompt的Button支持进一步分析；可为ECharts配置prompt供教师点击数据点追问。示意数值明确标注“演示/模拟数据”，不得伪造学生结果。按内容需要选组件，保持正文、公式和解答完整；不要只口头描述界面或返回图示建议。使用主题语义tone、响应式Grid，避免无关装饰。ECharts示例：{"series":[{"type":"bar","data":[62,85]}],"xAxis":{"type":"category","data":["Nu","Re"]},"yAxis":{"type":"value","name":"演示掌握度 %"},"tooltip":{"trigger":"axis"}}。所有选项为JSON；教学字段围栏仍与UI并列输出，供教案编辑及PPT生成。`;
