import { isTeachingChartOption } from "./teachingChartOptions.js";
import { z } from "zod";
import { safePath } from "./teachingDataPath.js";

const text = z.string().max(30000);
const componentSchema = z
  .object({
    id: z.string().min(1).max(80),
    component: z.enum([
      "Column",
      "Row",
      "Card",
      "Text",
      "Markdown",
      "Formula",
      "Mermaid",
      "Html",
      "Table",
      "Button",
      "TextField",
      "Grid",
      "Heading",
      "Badge",
      "Stat",
      "Progress",
      "Divider",
      "Select",
      "Checkbox",
      "ECharts",
    ]),
    children: z.array(z.string().max(80)).max(80).optional(),
    text: z.union([text, z.object({ path: z.string().regex(/^\//).max(500) }).strict()]).optional(),
    content: text.optional(),
    latex: text.optional(),
    displayMode: z.boolean().optional(),
    code: text.optional(),
    html: text.optional(),
    label: z.string().max(200).optional(),
    prompt: z.string().max(4000).optional(),
    columns: z
      .union([z.array(z.string().max(200)).max(20), z.number().int().min(1).max(4)])
      .optional(),
    description: z.string().max(2000).optional(),
    tone: z.enum(["default", "info", "success", "warning"]).optional(),
    value: z.union([z.string().max(500), z.number().finite()]).optional(),
    level: z.number().int().min(1).max(3).optional(),
    options: z.array(z.string().min(1).max(200)).min(1).max(40).optional(),
    // 必须在record解析可能移除危险key之前检查原始option，不能把异常配置静默清洗成有效配置。
    option: z
      .custom<Record<string, unknown>>(
        (value) =>
          !!value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          isTeachingChartOption(value as Record<string, unknown>),
        "Invalid chart option",
      )
      .optional(),
    height: z.number().int().min(240).max(640).optional(),
    rows: z
      .array(z.array(z.union([z.string().max(2000), z.number()])).max(20))
      .max(200)
      .optional(),
  })
  .strict();
export const teachingSurfaceSchema = z
  .object({
    title: z.string().min(1).max(200),
    surfaceId: z.string().min(1).max(200).optional(),
    dataModel: z.record(z.string(), z.unknown()).optional(),
    components: z.array(componentSchema).min(1).max(80),
  })
  .strict()
  .superRefine((surface, ctx) => {
    const nodes = new Map(surface.components.map((c) => [c.id, c]));
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (nodes.size !== surface.components.length || !nodes.has("root"))
      fail("Unique IDs and root required");
    const visited = new Set<string>();
    const visit = (id: string, path: string[]) => {
      if (visited.has(id)) {
        fail("Components must form a tree without shared children");
        return;
      }
      visited.add(id);
      if (path.includes(id) || path.length > 16) {
        fail("Cyclic or overly deep component tree");
        return;
      }
      const node = nodes.get(id);
      if (!node) {
        fail("Missing component reference");
        return;
      }
      for (const child of node.children ?? []) visit(child, [...path, id]);
    };
    // 每个组件都校验，避免未挂到 root 的非法树在后续版本中被激活。
    for (const node of surface.components) {
      if (node.text && typeof node.text === "object") {
        try {
          safePath(node.text.path);
        } catch {
          fail("Unsafe binding path");
        }
      }
      if (node.component === "Button" && !node.prompt?.trim()) fail("Button requires prompt");
      if (node.children?.length && !["Column", "Row", "Card", "Grid"].includes(node.component))
        fail("Only containers accept children");
      if (
        node.component === "Table" &&
        (!Array.isArray(node.columns) ||
          !node.rows ||
          node.rows.some((r) => r.length !== (node.columns as string[]).length))
      )
        fail("Table requires aligned columns and rows");
    }
    for (const node of surface.components) {
      if (node.component === "ECharts" && !node.option) fail("ECharts requires option");
      if (
        node.component === "Grid" &&
        node.columns !== undefined &&
        typeof node.columns !== "number"
      )
        fail("Grid columns must be numeric");
      if (
        node.component === "Select" &&
        (!node.options || new Set(node.options).size !== node.options.length)
      )
        fail("Select requires unique options");
      if (
        node.component === "Progress" &&
        (typeof node.value !== "number" || node.value < 0 || node.value > 100)
      )
        fail("Progress must be 0..100");
    }
    visit("root", []);
    if (visited.size !== nodes.size) fail("Unreachable component");
  });
export type TeachingSurface = z.infer<typeof teachingSurfaceSchema>;
export type TeachingComponent = TeachingSurface["components"][number];
