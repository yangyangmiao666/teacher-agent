#!/usr/bin/env node
/** 打包两套待审核材料，并核验正文长度、体积和完整性；不替代人工审核。 */
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { join, relative } from "node:path";
const require = createRequire(new URL("../packages/server/package.json", import.meta.url));
const { ZipFile } = require("yazl");
const outDir = "dist/submission";
await mkdir(outDir, { recursive: true });
const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");
async function list(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Submission cannot contain symlinks");
    if (entry.isDirectory()) result.push(...(await list(path)));
    else result.push(path);
  }
  return result.sort();
}
for (const [kind, directory] of [
  ["original", "docs/submission"],
  ["anonymous", "docs/submission-anonymous"],
]) {
  const manual = await readFile(join(directory, "建设说明书.md"), "utf8");
  const characters = [...manual.replace(/\s/g, "")].length;
  if (characters > 3000)
    throw new Error(`${kind} manual exceeds 3000 visible characters: ${characters}`);
  const files = (await list(directory)).filter((path) => !path.endsWith("材料清单.json"));
  const pdf = await readFile(join(directory, "建设说明书.pdf"));
  if (!pdf.includes(Buffer.from(`source-sha256:${sha(Buffer.from(manual))}`))) {
    throw new Error(`${kind} PDF is stale; regenerate with scripts/build-submission-pdfs.py`);
  }
  const manifest = [];
  const zip = new ZipFile();
  for (const file of files) {
    const content = await readFile(file);
    const path = relative(directory, file).replaceAll("\\", "/");
    if (file.endsWith(".md") && kind === "anonymous") {
      const text = content.toString("utf8");
      // 格式匹配只能筛出常见号码，不能证明所有个人信息已隐藏，仍须学校人工复核。
      if (
        /(?:\+?86[- ]?)?1[3-9]\d{9}\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\/Users\/|Bearer\s+[A-Za-z0-9_-]{20,}/.test(
          text,
        )
      ) {
        throw new Error(
          `Potential personal information or credential in anonymous material: ${path}`,
        );
      }
    }
    manifest.push({ path, bytes: content.length, sha256: sha(content) });
    zip.addBuffer(content, `${kind}-draft/${path}`);
  }
  const metadata = {
    product: "教智星",
    status: "待学校教务部门审核盖章的草稿",
    version: kind,
    manualVisibleCharacters: characters,
    personalInformationReview: "自动扫描仅辅助，学校须人工核验",
    files: manifest,
  };
  const manifestContent = JSON.stringify(metadata, null, 2) + "\n";
  await writeFile(join(directory, "材料清单.json"), manifestContent);
  zip.addBuffer(Buffer.from(manifestContent), `${kind}-draft/材料清单.json`);
  const output = join(outDir, `jiaozhixing-${kind}-draft.zip`);
  const completed = pipeline(zip.outputStream, createWriteStream(output));
  zip.end();
  await completed;
  const size = (await stat(output)).size;
  if (size > 50_000_000) throw new Error(`${kind} submission exceeds 50 MB`);
  console.log(
    `${kind}: ${characters} visible characters; ${files.length} files; ZIP ${size} bytes; ${output}`,
  );
}
