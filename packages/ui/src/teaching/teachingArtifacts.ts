import { z } from "zod";
export interface TeachingArtifact {
  id: string;
  name: string;
  path?: string;
  source: "workspace" | "local";
  createdAt: number;
}
const extensions = /\.(pptx|pdf|docx|xlsx|xls|md|html?|svg|png|jpe?g|webp)$/i;
/** 只接受当前目录内的文件路径，兼容Windows分隔符，不接受网络URL和穿越。 */
export function resolveTeachingArtifactPath(root: string, input: string): string | null {
  let path: string;
  try {
    path = decodeURIComponent(input.trim()).replace(/\\/g, "/");
  } catch {
    return null;
  }
  const base = root.replace(/\\/g, "/").replace(/\/+$/, "");
  if (
    !path ||
    /^[a-z]+:\/\//i.test(path) ||
    /^(data|javascript|file):/i.test(path) ||
    path.split("/").includes("..") ||
    !extensions.test(path)
  )
    return null;
  if (!path.startsWith("/") && !/^[a-z]:\//i.test(path))
    path = `${base}/${path.replace(/^\.\//, "")}`;
  const compare = (value: string) => (/^[a-z]:\//i.test(base) ? value.toLowerCase() : value);
  return compare(path).startsWith(compare(base + "/")) ? path : null;
}
const refsSchema = z.object({
  artifacts: z
    .array(z.object({ path: z.string().max(2000), name: z.string().max(200).optional() }))
    .max(50),
});
export function parseTeachingArtifacts(source: string, workspacePath: string): TeachingArtifact[] {
  const references: { path: string; name?: string }[] = [];
  for (const fence of source.matchAll(/^```jzx-artifacts[ \t]*\r?\n([\s\S]*?)^```[ \t]*\r?$/gim)) {
    try {
      references.push(...refsSchema.parse(JSON.parse(fence[1]!)).artifacts);
    } catch {
      /* 非法引用不触发文件读取。 */
    }
  }
  for (const match of source.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g))
    references.push({ name: match[1], path: match[2]! });
  return references.flatMap((item) => {
    const path = resolveTeachingArtifactPath(workspacePath, item.path);
    return path
      ? [
          {
            id: path,
            path,
            name: item.name || path.split("/").at(-1)!,
            source: "workspace" as const,
            createdAt: Date.now(),
          },
        ]
      : [];
  });
}
