export function safePath(path: string): string[] {
  if (!path.startsWith("/") || path.length > 500) throw new Error("Invalid JSON Pointer");
  if (path === "/") return [];
  const parts = path
    .slice(1)
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  if (
    parts.length > 16 ||
    parts.some((p) => !p || ["__proto__", "constructor", "prototype"].includes(p))
  )
    throw new Error("Unsafe data path");
  return parts;
}
