import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeTeachingMarkdown } from "../src/teaching/teachingMarkdown.js";
test("常见 LaTeX 分隔符转换而代码保留", () => {
  const source =
    String.raw`换热 \(q=h\Delta T\)。
\[Nu=\frac{hL}{\lambda}\]
` +
    "`" +
    String.raw`\(example\)` +
    "`" +
    "\n```tex\n" +
    String.raw`\[example\]` +
    "\n```";
  const actual = normalizeTeachingMarkdown(source);
  assert.ok(actual.includes("$q=h\\Delta T$"));
  assert.ok(actual.includes("$$\nNu=\\frac{hL}{\\lambda}\n$$"));
  assert.ok(actual.includes(String.raw`\(example\)`));
  assert.ok(actual.includes(String.raw`\[example\]`));
});
