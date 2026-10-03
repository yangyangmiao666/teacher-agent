import { writeTeachingArtifactBytes } from "./teachingArtifactCache.js";
import { teachingCanvasKey, useTeachingCanvasStore } from "@/store/teachingCanvasStore.js";
import { useState } from "react";
import type { TeachingCourseware } from "@/teaching/teachingTypes.js";
import { buildTeachingCoursewareSlides } from "@/teaching/teachingCoursewareSlides.js";

export function useTeachingCoursewareExport(scope: {
  workspacePath: string;
  workspaceIdentity?: string;
}) {
  const [exporting, setExporting] = useState(false);
  const download = async (item: TeachingCourseware, locale: string) => {
    if (exporting) return;
    setExporting(true);
    try {
      const { default: exported } = await import("pptxgenjs");
      // 上游声明被 NodeNext 视为 CJS namespace，而 Vite 的 import 分支提供真实构造器；
      // 仅在第三方入口纠正声明，保留 PPTX API 的完整类型检查。
      const PptxGenJS = exported as unknown as typeof exported.default;
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "教智星";
      pptx.subject = "教师审定前的课件初稿";
      pptx.title = item.title;
      pptx.theme = {
        headFontFace: "Microsoft YaHei",
        bodyFontFace: "Microsoft YaHei",
      };
      const cover = pptx.addSlide();
      cover.background = { color: "203452" };
      cover.addShape(pptx.ShapeType.rect, {
        x: 10.9,
        y: 0.8,
        w: 1.5,
        h: 1.5,
        rotate: 15,
        fill: { color: "C46B40" },
        line: { color: "C46B40" },
      });
      cover.addText(item.title, {
        x: 0.8,
        y: 1.7,
        w: 11.6,
        h: 1.7,
        fontSize: 34,
        bold: true,
        color: "FFFFFF",
        fit: "shrink",
      });
      cover.addText(item.courseName, {
        x: 0.8,
        y: 3.8,
        w: 11.6,
        h: 0.8,
        fontSize: 22,
        color: "CBD5E1",
      });
      cover.addText(
        locale === "zh-CN"
          ? "教智星 · 教学课件初稿 · 请教师审定后使用"
          : "JiaoZhiXing · Teaching draft · Teacher review required",
        { x: 0.8, y: 6.5, w: 11.6, h: 0.4, fontSize: 12, color: "CBD5E1" },
      );
      cover.addNotes(item.scriptNotes);
      const pages = buildTeachingCoursewareSlides(item, locale);
      for (const [index, page] of pages.entries()) {
        const slide = pptx.addSlide();
        slide.background = { color: "F6F4EF" };
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.7,
          y: 1.65,
          w: 11.9,
          h: 4.9,
          fill: { color: "FFFFFF" },
          line: { color: "FFFFFF" },
        });
        slide.addShape(pptx.ShapeType.rect, {
          x: 11.8,
          y: 0.5,
          w: 0.8,
          h: 0.8,
          fill: { color: "C46B40" },
          line: { color: "C46B40" },
        });
        slide.addText(String(index + 1).padStart(2, "0"), {
          x: 11.8,
          y: 0.7,
          w: 0.8,
          h: 0.3,
          fontSize: 16,
          bold: true,
          color: "FFFFFF",
          align: "center",
          margin: 0,
        });
        slide.addText(page.title, {
          x: 0.7,
          y: 0.5,
          w: 10.5,
          h: 0.9,
          fontSize: 28,
          bold: true,
          color: "2F55D4",
          fit: "shrink",
        });
        if (page.body)
          slide.addText(page.body, {
            x: 0.8,
            y: 1.8,
            w: 11.7,
            h: 4.6,
            fontSize: 23,
            paraSpaceAfter: 12,
            breakLine: false,
            color: "203452",
            valign: "top",
            fit: "shrink",
            margin: 0,
          });
        slide.addText(`${item.courseName} · ${index + 1}/${pages.length}`, {
          x: 0.8,
          y: 6.85,
          w: 11.7,
          h: 0.25,
          fontSize: 10,
          color: "52627A",
        });
        slide.addNotes(page.notes);
      }
      const filename =
        item.title.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80) || "teaching-courseware";
      const data = (await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer;
      const id = crypto.randomUUID();
      await writeTeachingArtifactBytes(id, data);
      const key = teachingCanvasKey(
        scope.workspacePath,
        scope.workspaceIdentity,
        "courseware-editor",
      );
      useTeachingCanvasStore
        .getState()
        .addArtifacts(
          key,
          [{ id, name: `${filename}.pptx`, source: "local", createdAt: Date.now() }],
          true,
        );
      const url = URL.createObjectURL(
        new Blob([data], {
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${filename}.pptx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };
  return { exporting, download };
}
