import { z } from "zod";

export const teachingCoursewareSlideSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(3000),
  notes: z.string().max(6000).default(""),
});

/** 模型只能修改教学内容，不能覆盖条目标识与更新时间。 */
export const teachingCoursewarePatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    courseName: z.string().max(200).optional(),
    goals: z.string().max(12000).optional(),
    outline: z.string().max(24000).optional(),
    interactions: z.string().max(12000).optional(),
    scriptNotes: z.string().max(24000).optional(),
    slides: z.array(teachingCoursewareSlideSchema).min(1).max(80).optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
