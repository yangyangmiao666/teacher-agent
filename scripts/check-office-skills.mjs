import { createHash } from "node:crypto";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const pack = resolve(
  process.argv[2] ?? resolve(import.meta.dirname, "../apps/zcode-cli/packages/bundled-skills"),
);
const manifest = JSON.parse(await readFile(resolve(pack, "office-migration.json"), "utf8"));
for (const name of manifest.skills) {
  const text = await readFile(resolve(pack, "skills", name, "SKILL.md"), "utf8");
  if (!text.startsWith("---\n") || !text.includes(`name: ${name}\n`)) {
    throw new Error(`Invalid skill entry: ${name}`);
  }
}
for (const file of manifest.files) {
  const bytes = await readFile(resolve(pack, file.path));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== file.sha256) throw new Error(`Office skill asset changed: ${file.path}`);
}
for (const name of ["docx", "xlsx", "pptx", "pdf"]) {
  await access(resolve(pack, "skills", name, "LICENSE.txt"));
  await access(resolve(pack, "skills", name, "scripts"));
}
console.log(`Office skills OK: ${manifest.skills.length} entries, ${manifest.files.length} assets`);
