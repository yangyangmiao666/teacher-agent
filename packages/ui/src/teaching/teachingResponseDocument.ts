const labels: Record<string, string> = {
  title: "标题",
  courseName: "课程",
  goals: "教学目标",
  outline: "页序提纲",
  interactions: "课堂互动",
  scriptNotes: "讲稿要点",
  notes: "讲稿",
  body: "正文",
  objectives: "教学目标",
  keyPoints: "教学重点",
  difficultPoints: "教学难点",
  teachingProcess: "教学过程",
  homework: "课后任务",
  outcomeAlignment: "成果导向对齐",
  background: "案例背景",
  problem: "问题",
  analysis: "分析",
  questions: "试题",
  stem: "题干",
  answer: "答案",
  score: "分值",
  knowledgeLabel: "知识点",
  knowledgeStats: "学情分析",
  feedback: "反馈",
  rubric: "评分标准",
};
const omitted = new Set(["id", "updatedAt", "questionIds", "knowledgeId"]);
function describe(value: unknown, depth = 0): string {
  if (depth > 6 || value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value))
    return value
      .slice(0, 200)
      .map((item, index) => {
        if (item && typeof item === "object" && "title" in item)
          return `### ${index + 1}. ${String(item.title)}\n\n${describe(Object.fromEntries(Object.entries(item).filter(([key]) => key !== "title")), depth + 1)}`;
        return `**${index + 1}.** ${describe(item, depth + 1)}`;
      })
      .join("\n\n");
  return Object.entries(value)
    .filter(([key]) => !omitted.has(key))
    .map(([key, content]) => `**${labels[key] || key}**\n\n${describe(content, depth + 1)}`)
    .join("\n\n");
}
/** 教学结构作为阅读投影展示，不将协议JSON直接铺到教师画布。 */
export function teachingResponseDocument(source: string): string {
  const text = source.replace(
    /^```jzx-(lesson(?:-plan)?|courseware(?:-outline)?|case(?:-mining)?|exam(?:-paper)?|review|analytics|lab(?:-practicum)?)[ \t]*\r?\n([\s\S]*?)^```[ \t]*\r?$/gim,
    (fence, _kind, body) => {
      try {
        return describe(JSON.parse(body));
      } catch {
        return fence;
      }
    },
  );
  // A2UI旁的普通Markdown同样是教学正文，不能仅凭有无教学JSON围栏丢弃。
  return text
    .replace(/^```(?:jzx-ui|a2ui|jzx-artifacts)[ \t]*\r?\n[\s\S]*?^```[ \t]*\r?$/gim, "")
    .trim();
}
