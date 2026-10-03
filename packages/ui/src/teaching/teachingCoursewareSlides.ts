import type { TeachingCourseware } from "./teachingTypes.js";

export interface TeachingCoursewareSlide {
  title: string;
  body: string;
  notes: string;
}

export function buildTeachingCoursewareSlides(
  item: TeachingCourseware,
  locale: string,
): TeachingCoursewareSlide[] {
  if (item.slides?.length) {
    return item.slides.flatMap((page) => {
      const text = [...page.body];
      const count = Math.max(1, Math.ceil(text.length / 360));
      return Array.from({ length: count }, (_, index) => ({
        title: count > 1 ? `${page.title} (${index + 1}/${count})` : page.title,
        body: text.slice(index * 360, (index + 1) * 360).join(""),
        notes: page.notes,
      }));
    });
  }
  const zh = locale === "zh-CN";
  const sections: { title: string; lines: string[] }[] = [];
  if (item.goals.trim())
    sections.push({ title: zh ? "教学目标" : "Learning goals", lines: [item.goals] });
  let current: { title: string; lines: string[] } | undefined;
  for (const raw of item.outline.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const heading = /^(?:#{1,3}\s+|\d+[.、)）]\s*)(.+)$/.exec(line);
    if (heading) {
      current = { title: heading[1] ?? "", lines: [] };
      sections.push(current);
    } else {
      if (!current) {
        current = { title: item.title, lines: [] };
        sections.push(current);
      }
      current.lines.push(line.replace(/^[-*]\s+/, ""));
    }
  }
  if (item.interactions.trim())
    sections.push({ title: zh ? "课堂互动" : "Classroom activities", lines: [item.interactions] });
  return sections.flatMap((section) => {
    const text = [...section.lines.join("\n")];
    const pages = Math.max(1, Math.ceil(text.length / 360));
    return Array.from({ length: pages }, (_, index) => ({
      title: pages > 1 ? `${section.title} (${index + 1}/${pages})` : section.title,
      body: text.slice(index * 360, (index + 1) * 360).join(""),
      notes: item.scriptNotes,
    }));
  });
}
