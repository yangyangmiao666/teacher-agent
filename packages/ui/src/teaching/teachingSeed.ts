/* oxlint-disable eslint(max-lines) -- 演示种子数据集中维护传输原理样例；按字段拆文件收益低。 */
import type {
  ExamQuestion,
  HomeworkSubmission,
  KnowledgeStat,
  TeachingCase,
  TeachingCourseware,
  TeachingLabMaterial,
  TeachingLessonPlan,
  TeachingWorkspaceData,
} from "./teachingTypes.js";

/** 演示领域扩展（课件/案例/实训/题库）时递增，用于淘汰旧本地缓存。 */
export const TEACHING_SEED_VERSION = 4;

function id(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSeedTeachingData(): TeachingWorkspaceData {
  const lessonId = id("lesson");
  const coursewareId = id("cw");
  const caseId = id("case");
  const labId = id("lab");

  const lessons: TeachingLessonPlan[] = [
    {
      id: lessonId,
      title: "对流传热与努塞尔数",
      courseName: "材料加工冶金与传输原理",
      hours: 2,
      audience: "材料/冶金类本科三年级（演示班）",
      objectives:
        "知识：掌握对流传热机理、牛顿冷却公式与努塞尔数 Nu 的物理意义。\n能力：能对简单管流/平板工况估算对流换热系数并核算热流密度。\n素养：用工程量级判断与单位一致性检验计算结果。",
      keyPoints: "强制对流与自然对流的区分；Nu=f(Re,Pr) 相似关联；边界层概念。",
      difficulties: "特征尺寸与定性温度选取；关联式适用范围；与导热、辐射的耦合判断。",
      process:
        "导入（10'）加热炉工件表面冷却案例\n讲授（40'）对流机理、Nu/Re/Pr 与典型关联式\n练习（30'）圆管湍流 Nu 估算与热流核算\n小结（10'）工程选用表与常见误区",
      ideologyNotes: "结合冶金节能降耗，强调「可测、可算、可验证」的工程责任意识。",
      homework: "完成圆管强制对流换热书面题；预习传质与施密特数 Sc。",
      outcomeAlignment: [
        {
          id: "co1",
          code: "CO1",
          statement: "掌握对流传热基本概念与 Nu 的物理意义",
          covered: true,
        },
        {
          id: "co2",
          code: "CO2",
          statement: "能选用关联式完成简单工况换热估算",
          covered: true,
        },
        {
          id: "co3",
          code: "CO3",
          statement: "具备工程量级判断与单位一致性检验意识",
          covered: false,
        },
      ],
      updatedAt: Date.now(),
    },
  ];

  const coursewares: TeachingCourseware[] = [
    {
      id: coursewareId,
      title: "对流传热与努塞尔数（演示课件）",
      slides: [
        {
          title: "工程导入：工件出炉冷却",
          body: "热处理工件出炉后向空气散热。\n在相同温差下，风冷通常比静止空气冷却更快，原因是流动改变边界层并增强换热。\n本节目标：解释换热系数 h、努塞尔数 Nu 的意义，并识别关联式的适用条件。",
          notes:
            "演示案例，无真实企业数据。请学生先预测提高风速对冷却速率的影响；提醒本节暂忽略辐射，真实高温工件需考虑辐射贡献。",
        },
        {
          title: "牛顿冷却公式与变量",
          body: "q = h(Ts − T∞)\nq：热流密度，W/m²；h：对流换热系数，W/(m²·K)。\nTs：表面温度；T∞：远离壁面的流体温度。\nh 不是材料固有常数，与流速、物性、几何形状和边界条件有关。",
          notes:
            "区分热流密度 q 与总热流量 Q=hAΔT。让学生通过单位相乘核验结果；温差用 K 或 ℃数值一致。",
        },
        {
          title: "Nu、Re 与 Pr 的角色",
          body: "Nu = hL/λ：对流换热相对于特征尺度纯导热的增强。\nRe = ρuL/μ：惯性与黏性作用之比，用于判断流态。\nPr = cpμ/λ：动量扩散与热扩散能力之比。\nNu=f(Re,Pr) 的具体形式依赖几何与边界条件；Nu 与 Re 不能互相代替。",
          notes:
            "L 为特征长度，λ 为流体导热系数。把工件外流和管内流作比较，提醒学生不能直接套用同一关联式。",
        },
        {
          title: "课堂练习与解答",
          body: "示例：h=100 W/(m²·K)，L=0.05 m，λ=0.5 W/(m·K)。\n求 Nu，并说明提高 h 会怎样影响 Nu。\n解答：Nu=hL/λ=100×0.05/0.5=10。L 与 λ 不变时，Nu 与 h 成正比。\n出口检查：用一句话说明为什么“Nu 等于 Re”是错误的。",
          notes:
            "这些数值是教学示例。先独立计算再同伴核对；答案应包含量纲消去与变量含义，不只给出数字。",
        },
      ],
      courseName: "材料加工冶金与传输原理",
      goals: "建立 Nu/Re/Pr 概念框架；完成一道管流估算；澄清与 Re 的混淆。",
      outline: `1. 封面与学习目标（2'）
2. 工程导入：工件出炉冷却（3'）
3. 传热三方式回顾（3'）
4. 对流机理：动量与能量交换（5'）
5. 牛顿冷却公式 q=hΔT（4'）
6. 换热系数 h 的影响因素（4'）
7. 量纲分析引入 Nu（5'）
8. Nu 的物理意义（相对纯导热）（5'）
9. Re 与流态（4'）
10. Pr 与物性（3'）
11. 相似关联 Nu=f(Re,Pr)（5'）
12. 管流湍流 Dittus–Boelter 示例（5'）
13. 特征尺寸与定性温度（4'）
14. 随堂估算：圆管工况（8'）
15. 常见误区：Nu≠Re（3'）
16. 与冶金工况的联系（加热炉壁面）（3'）
17. 小结与检查清单（3'）
18. 课后任务与预习（2'）`,
      interactions:
        "第 8 页：请学生用一句话解释 Nu。\n第 14 页：分组估算 Re/Nu，核对量级。\n第 15 页：投票「Nu 是否等于 Re」。",
      scriptNotes: "口语强调：Nu 大≠流速大，而是对流相对导热的增强。估算时先判流态再选关联式。",
      updatedAt: Date.now(),
    },
  ];

  const cases: TeachingCase[] = [
    {
      id: caseId,
      title: "星河特钢加热炉热平衡讨论案",
      courseName: "材料加工冶金与传输原理",
      knowledgeLabel: "加热炉热平衡（K07）",
      background:
        "虚构企业「星河特钢」一条连续加热炉产线近两周能耗偏高。公开量级数据：炉膛设定温度区间升高约 30℃，产量持平，烟气温度略升。不涉及真实厂名与可识别人员。",
      problem:
        "班组争论焦点：是「有效热」侧物料升温需求变了，还是「热损失」侧炉体/烟气带走热量增加？如何用热平衡框架做可验证的排查？",
      analysis:
        "教师参考：先列有效热（物料升温、相变）与损失项（烟气、炉墙、冷却水、开口辐射等）；用相对比例而非绝对机密数据比较；结合测点（烟气 T、壁温、产量）提出 2–3 条可验证假设。",
      discussion:
        "1）哪些量应归入有效热？\n2）若产量不变而设定温度升高，优先检查哪一类损失？\n3）如何设计一周内的低成本验证实验？",
      desensitization: "企业名虚构；产量/温度仅用区间与相对变化；无工号、姓名、内部系统地址。",
      updatedAt: Date.now(),
    },
  ];

  const labs: TeachingLabMaterial[] = [
    {
      id: labId,
      title: "圆管强制对流换热实验",
      courseName: "材料加工冶金与传输原理",
      objectives: "测定不同流速下圆管段对流换热系数；计算 Re、Nu；对比经验关联式量级。",
      principle: "牛顿冷却；Nu=hd/λ；湍流区可采用 Nu=C Re^m Pr^n 形式关联。",
      equipment: "恒温水浴/电加热段、圆管试件、流量计、进出口热电偶、数据采集器、防护手套。",
      steps: `1. 检查水路与电气安全联锁。
2. 记录管径、加热段长度与流体物性表。
3. 设定 3 档流量，稳态后记录进出口温度与壁温。
4. 计算热流、平均温差、h、Re、Nu。
5. 与选定关联式比较并讨论偏差来源。
6. 关机、泄压、整理台面。`,
      safety: "防烫伤与漏电；禁止带压拆卸；溢水立即断电；实验服与护目镜必戴。",
      dataSheet: `| 工况 | 流量 (L/min) | T_in (℃) | T_out (℃) | T_wall (℃) | Re | Nu | h (W/m²K) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |`,
      rubric: "过程规范 30% · 数据完整性 20% · 计算正确性 30% · 误差分析与结论 20%。",
      updatedAt: Date.now(),
    },
  ];

  const questions: ExamQuestion[] = [
    {
      id: id("q"),
      type: "single",
      knowledgeId: "K02",
      knowledgeLabel: "对流传热与努塞尔数",
      difficulty: "easy",
      stem: "牛顿冷却公式中，对流热流密度 q 与温差 ΔT 的关系是？",
      answer: "q = h·ΔT（h 为对流换热系数）",
      score: 5,
    },
    {
      id: id("q"),
      type: "fill",
      knowledgeId: "K01",
      knowledgeLabel: "动量传递与雷诺数",
      difficulty: "easy",
      stem: "圆管内流动常用雷诺数 Re=ρud/μ。当 Re 远大于临界值时，流动通常进入____状态。",
      answer: "湍流（或紊流）",
      score: 5,
    },
    {
      id: id("q"),
      type: "short",
      knowledgeId: "K03",
      knowledgeLabel: "传质与菲克定律",
      difficulty: "medium",
      stem: "简述一维稳态扩散中菲克第一定律的物理含义，并写出通量与浓度梯度的关系式。",
      answer: "扩散通量与浓度梯度成正比、方向由高浓度指向低浓度；J=-D·(dc/dx)。",
      score: 10,
    },
    {
      id: id("q"),
      type: "calc",
      knowledgeId: "K02",
      knowledgeLabel: "对流传热与努塞尔数",
      difficulty: "hard",
      stem: "已知管内径 d=0.05 m，平均流速 u=2 m/s，流体物性 ρ=1000 kg/m³、μ=1×10⁻³ Pa·s、Pr=7，关联式 Nu=0.023 Re^0.8 Pr^0.4（适用湍流）。求 Re、Nu，并说明是否可用该关联式。",
      answer:
        "Re=ρud/μ=1e5（湍流，可用）；Nu=0.023×(1e5)^0.8×7^0.4≈366（量级示意，保留计算过程即可）。",
      score: 15,
    },
    {
      id: id("q"),
      type: "single",
      knowledgeId: "K07",
      knowledgeLabel: "加热炉热平衡",
      difficulty: "medium",
      stem: "加热炉热平衡分析中，下列哪一项通常计入「有效热」一侧？",
      answer: "物料升温与相变所需热量",
      score: 5,
    },
    {
      id: id("q"),
      type: "single",
      knowledgeId: "K04",
      knowledgeLabel: "边界层与相似准则",
      difficulty: "medium",
      stem: "关于速度边界层与温度边界层厚度关系，下列叙述更合理的是？",
      answer: "取决于 Pr：Pr>1 时温度边界层通常薄于速度边界层（量级关系）",
      score: 5,
    },
    {
      id: id("q"),
      type: "fill",
      knowledgeId: "K05",
      knowledgeLabel: "导热与傅里叶定律",
      difficulty: "easy",
      stem: "傅里叶定律指出，热流密度与温度梯度成正比，一维形式可写为 q=____。",
      answer: "−λ·(dT/dx)（符号表示由高温指向低温）",
      score: 5,
    },
    {
      id: id("q"),
      type: "short",
      knowledgeId: "K06",
      knowledgeLabel: "凝固过程传热",
      difficulty: "medium",
      stem: "简述凝固前沿推进与冷却速率对铸件组织可能的影响（定性即可）。",
      answer:
        "冷却速率提高通常细化组织；前沿推进受导热/对流与潜热释放制约，过快可能导致缺陷风险上升。",
      score: 10,
    },
    {
      id: id("q"),
      type: "calc",
      knowledgeId: "K01",
      knowledgeLabel: "动量传递与雷诺数",
      difficulty: "medium",
      stem: "圆管 d=0.04 m，流体 ρ=980 kg/m³、μ=8×10⁻⁴ Pa·s，平均流速 u=1.5 m/s。计算 Re，并判断更接近层流还是湍流（临界值可取约 2300）。",
      answer: "Re=ρud/μ≈7.35×10⁴，远高于临界值，判为湍流。",
      score: 10,
    },
    {
      id: id("q"),
      type: "short",
      knowledgeId: "K02",
      knowledgeLabel: "对流传热与努塞尔数",
      difficulty: "easy",
      stem: "用一句话说明 Nu 与 Re 为何不能等同。",
      answer: "Nu 表征对流相对纯导热的增强；Re 表征惯性与粘性之比、用于判流态，物理含义不同。",
      score: 8,
    },
    {
      id: id("q"),
      type: "single",
      knowledgeId: "K07",
      knowledgeLabel: "加热炉热平衡",
      difficulty: "easy",
      stem: "烟气带走的热量在热平衡中通常归入？",
      answer: "热损失（或排出热）一侧",
      score: 5,
    },
    {
      id: id("q"),
      type: "fill",
      knowledgeId: "K03",
      knowledgeLabel: "传质与菲克定律",
      difficulty: "easy",
      stem: "传质中与 Pr 类似的物性无量纲数常称为____数（Sc）。",
      answer: "施密特（Schmidt）",
      score: 5,
    },
  ];

  const submissions: HomeworkSubmission[] = [
    {
      id: id("hw"),
      alias: "同学 A17",
      prompt: "简述对流传热中努塞尔数 Nu 的物理意义，并说明 Nu 增大通常意味着什么。",
      answer: "Nu 表示对流相对纯导热的增强程度。Nu 越大，一般说明对流换热越强，h 也更大。",
      suggestedScore: null,
      maxScore: 10,
      feedback: "",
      updatedAt: Date.now(),
    },
    {
      id: id("hw"),
      alias: "同学 A23",
      prompt: "简述对流传热中努塞尔数 Nu 的物理意义，并说明 Nu 增大通常意味着什么。",
      answer: "Nu 就是雷诺数，越大流体越湍流。所以 Nu 大表示流速大。",
      suggestedScore: null,
      maxScore: 10,
      feedback: "",
      updatedAt: Date.now(),
    },
  ];

  const knowledgeStats: KnowledgeStat[] = [
    {
      knowledgeId: "K01",
      label: "动量传递与雷诺数",
      avgScoreRate: 76,
      belowSixtyRate: 14,
      reteachHint: "用管流算例强化 Re 判据，对照层流/湍流速度剖面示意。",
    },
    {
      knowledgeId: "K02",
      label: "对流传热与努塞尔数",
      avgScoreRate: 54,
      belowSixtyRate: 38,
      reteachHint: "板书对比 Nu 与 Re 定义；补一道 Nu 估算与「Nu≠Re」辨析题。",
    },
    {
      knowledgeId: "K03",
      label: "传质与菲克定律",
      avgScoreRate: 58,
      belowSixtyRate: 34,
      reteachHint: "类比傅里叶定律讲菲克定律，强调通量方向与符号约定。",
    },
    {
      knowledgeId: "K04",
      label: "边界层与相似准则",
      avgScoreRate: 49,
      belowSixtyRate: 44,
      reteachHint: "用 Pr 调节速度/温度边界层厚度示意，配 2 道概念判断题。",
    },
    {
      knowledgeId: "K05",
      label: "导热与傅里叶定律",
      avgScoreRate: 72,
      belowSixtyRate: 16,
      reteachHint: "复习一维稳态导热与热阻串联，作为对流对比的基线。",
    },
    {
      knowledgeId: "K06",
      label: "凝固过程传热",
      avgScoreRate: 51,
      belowSixtyRate: 40,
      reteachHint: "结合冷却曲线讲凝固前沿与潜热，布置定性讨论题。",
    },
    {
      knowledgeId: "K07",
      label: "加热炉热平衡",
      avgScoreRate: 47,
      belowSixtyRate: 46,
      reteachHint: "用有效热/损失项分类表做案例研讨（见案例库演示案）。",
    },
    {
      knowledgeId: "K08",
      label: "轧制变形区摩擦与传热",
      avgScoreRate: 61,
      belowSixtyRate: 27,
      reteachHint: "简述接触传热与摩擦生热贡献，配一道概念选择题。",
    },
    {
      knowledgeId: "K09",
      label: "气体在金属中的溶解扩散",
      avgScoreRate: 55,
      belowSixtyRate: 36,
      reteachHint: "联系菲克定律讲溶解-扩散路径，强调安全与氢脆入门概念。",
    },
    {
      knowledgeId: "K10",
      label: "冶金反应器传递耦合",
      avgScoreRate: 48,
      belowSixtyRate: 42,
      reteachHint: "用一张耦合示意（动量-热量-质量）串讲，避免公式堆叠。",
    },
  ];

  return {
    seedVersion: TEACHING_SEED_VERSION,
    lessons,
    activeLessonId: lessonId,
    coursewares,
    activeCoursewareId: coursewareId,
    cases,
    activeCaseId: caseId,
    labs,
    activeLabId: labId,
    questions,
    paper: {
      id: id("paper"),
      title: "材料加工冶金与传输原理随堂测验（演示）",
      questionIds: questions.slice(0, 4).map((q) => q.id),
      updatedAt: Date.now(),
    },
    examKnowledgeFilter: "",
    submissions,
    knowledgeStats,
  };
}

export function buildLessonMarkdown(lesson: TeachingLessonPlan): string {
  return `# 教案：${lesson.title}

- 课程：${lesson.courseName}
- 学时：${lesson.hours}
- 授课对象：${lesson.audience}
- 更新：${new Date(lesson.updatedAt).toISOString()}

## 教学目标

${lesson.objectives}

## 教学重点

${lesson.keyPoints}

## 教学难点

${lesson.difficulties}

## 教学过程

${lesson.process}

## 思政融入

${lesson.ideologyNotes}

## 课后任务

${lesson.homework}

## 成果导向对齐（OBE）

${
  (lesson.outcomeAlignment ?? [])
    .map((item) => `- [${item.covered ? "x" : " "}] ${item.code} ${item.statement}`)
    .join("\n") || "- （待填写课程目标对齐）"
}
`;
}

export function buildCoursewareMarkdown(item: TeachingCourseware): string {
  return `# 课件：${item.title}

- 课程：${item.courseName}
- 更新：${new Date(item.updatedAt).toISOString()}

## 目标

${item.goals}

## 页序提纲

${item.outline}

## 互动插入点

${item.interactions}

## 讲稿要点

${item.scriptNotes}

${(item.slides ?? []).map((page, index) => `## 第 ${index + 1} 页：${page.title}\n\n${page.body}\n\n讲稿：${page.notes}`).join("\n\n")}
`;
}

export function buildCaseMarkdown(item: TeachingCase): string {
  return `# 教学案例：${item.title}

- 课程：${item.courseName}
- 知识点：${item.knowledgeLabel}
- 更新：${new Date(item.updatedAt).toISOString()}

## 背景

${item.background}

## 核心问题

${item.problem}

## 分析路径（教师参考）

${item.analysis}

## 讨论题

${item.discussion}

## 脱敏说明

${item.desensitization}
`;
}

export function buildLabMarkdown(item: TeachingLabMaterial): string {
  return `# 实训指导书：${item.title}

- 课程：${item.courseName}
- 更新：${new Date(item.updatedAt).toISOString()}

## 目的

${item.objectives}

## 原理摘要

${item.principle}

## 器材

${item.equipment}

## 步骤

${item.steps}

## 安全须知

${item.safety}

## 数据记录表

${item.dataSheet}

## 评分量表

${item.rubric}
`;
}

export function buildExamMarkdown(
  title: string,
  questions: ExamQuestion[],
  includeAnswers: boolean,
): string {
  const lines = [`# ${title}`, "", includeAnswers ? "（教师版含答案）" : "（学生版）", ""];
  let total = 0;
  questions.forEach((q, index) => {
    total += q.score;
    lines.push(`## ${index + 1}. [${q.type}/${q.difficulty}/${q.score}分] ${q.knowledgeLabel}`);
    lines.push("");
    lines.push(q.stem);
    lines.push("");
    if (includeAnswers) {
      lines.push(`**参考答案：** ${q.answer}`);
      lines.push("");
    }
  });
  lines.push(`总分：${total}`);
  return lines.join("\n");
}

export function buildBlueprintMarkdown(title: string, questions: ExamQuestion[]): string {
  const rows = ["| 题号 | 题型 | 知识点 | 难度 | 分值 |", "| --- | --- | --- | --- | --- |"];
  questions.forEach((q, index) => {
    rows.push(`| ${index + 1} | ${q.type} | ${q.knowledgeLabel} | ${q.difficulty} | ${q.score} |`);
  });
  return `# 双向细目表：${title}\n\n${rows.join("\n")}\n`;
}
