import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTeachingCoursewareSlides } from "../src/teaching/teachingCoursewareSlides.js";
const courseware = {
  id: "test",
  title: "传热课件",
  courseName: "虚构课程",
  goals: "理解 Nu 的物理意义",
  outline: "1. 工程导入\n- 炉壁散热\n2. 对流机理\n- 单位核验",
  interactions: "分组讨论",
  scriptNotes: "教师先核对关联式适用范围",
  updatedAt: 0,
};
test("目标、编号页面、互动与备注完整保留", () => {
  const slides = buildTeachingCoursewareSlides(courseware, "zh-CN");
  assert.deepEqual(
    slides.map((slide) => slide.title),
    ["教学目标", "工程导入", "对流机理", "课堂互动"],
  );
  assert.equal(slides[1]?.body, "炉壁散热");
  assert.equal(slides[2]?.body, "单位核验");
  assert.ok(slides.every((slide) => slide.notes === courseware.scriptNotes));
});
test("Markdown 页与超长内容自动分段，无截断", () => {
  const long = "这是连续的专业教学说明。".repeat(100);
  const slides = buildTeachingCoursewareSlides(
    { ...courseware, goals: "", interactions: "", outline: `## 对流传热\n${long}` },
    "zh-CN",
  );
  assert.ok(slides.length > 1);
  assert.equal(slides.map((slide) => slide.body).join(""), long);
  assert.ok(slides.every((slide) => slide.body.length <= 360));
});
test("空提纲仍可导出教学目标和互动", () => {
  assert.equal(buildTeachingCoursewareSlides({ ...courseware, outline: "" }, "en-US").length, 2);
});

test("完整正文优先于提纲，逐页备注独立保留，长正文无丢失", () => {
  const body = "冶金案例分析".repeat(160);
  const slides = buildTeachingCoursewareSlides(
    {
      ...courseware,
      slides: [
        { title: "完整案例", body, notes: "先讨论再推导" },
        { title: "课堂解答", body: "Nu=10", notes: "核验单位" },
      ],
    },
    "zh-CN",
  );
  assert.equal(
    slides
      .slice(0, -1)
      .map((slide) => slide.body)
      .join(""),
    body,
  );
  assert.ok(slides.slice(0, -1).every((slide) => slide.notes === "先讨论再推导"));
  assert.equal(slides.at(-1)?.notes, "核验单位");
  assert.equal(
    slides.some((slide) => slide.title === "教学目标"),
    false,
  );
});
