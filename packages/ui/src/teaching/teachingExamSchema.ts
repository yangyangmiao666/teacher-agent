import { z } from "zod";
import { normalizeExamQuestionType } from "./teachingTypes.js";

// 智能体可能把题号输出为数字；可选链只判断空值，不能保证有 trim 方法。
// 在 JSON / 应用边界统一转成字符串，空 ID 交给现有应用路径生成。
const questionIdSchema = z
  .union([z.string(), z.number().finite()])
  .nullish()
  .transform((id) => (id == null ? undefined : String(id).trim() || undefined));

const questionSchema = z.object({
  id: questionIdSchema,
  type: z.enum(["single", "fill", "short", "calc", "code"]).transform(normalizeExamQuestionType),
  knowledgeId: z.string(),
  knowledgeLabel: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  stem: z.string().trim().min(1),
  answer: z.string(),
  score: z.number().finite().positive(),
});

/** 整份校验后才能写入，避免前几道题成功、后续题报错留下半份试卷。 */
export const teachingExamSchema = z
  .object({
    title: z.string().optional(),
    questions: z.array(questionSchema).min(1),
  })
  .refine((exam) => {
    const ids = exam.questions.flatMap((question) => (question.id ? [question.id] : []));
    return new Set(ids).size === ids.length;
  }, "Question IDs must be unique");
