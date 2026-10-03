# 教智星（JiaoZhiXing）

面向高校专业课教师的教学智能体：覆盖课前教案与课件、案例挖掘，课后组卷与作业评阅、学情分析，以及实验实训材料生成。Web 端可本地或阿里云部署，通过智能化工具减轻备课、命题与评阅负担。

## 快速开始（Web）

准备 Git、Node.js **24.14.0** 和 pnpm **10.33.2**（见 [mise.toml](mise.toml)）。

```bash
pnpm bootstrap
# 指定演示课程工作区
JZX_SERVER_WORKSPACE="$(pwd)/demo/jiaozhixing-course" pnpm dev:web
# 兼容读取：ZCODE_SERVER_WORKSPACE 亦可
```

浏览器打开开发地址（默认 `http://localhost:5173`）。演示工作区说明见 [demo/jiaozhixing-course/AGENTS.md](demo/jiaozhixing-course/AGENTS.md)。

打开工作区后默认进入「教学工作台」（默认教案编辑器，课前 / 课后 / 实践子台）；侧栏可切换对话与智能体生成。

| 场景 | 技能 | 产出目录 |
| --- | --- | --- |
| 教案撰写 | lesson-plan | outputs/lesson-plans |
| 课件提纲 | courseware-outline | outputs/courseware |
| 案例挖掘 | case-mining | outputs/cases |
| 智能组卷 | exam-paper | outputs/exams |
| 作业评阅 | homework-review | outputs/reviews |
| 学情分析 | learning-analytics | outputs/reviews |
| 实训材料 | lab-practicum | outputs/lab |

## 部署

见 [docs/deploy-aliyun.md](docs/deploy-aliyun.md) 与 [deploy/](deploy/)。公网须配置限时访问令牌与服务端到期时间；可用 `node scripts/gen-test-access.mjs` 生成测试链接说明与二维码。

构建可运行 Web 包：`pnpm build:jzx`。课件子台支持下载可编辑 PowerPoint 初稿。模型须先在设置中配置自定义供应商。

## 申报材料

- 建设说明书与佐证：`docs/submission/`
- 匿名版：`docs/submission-anonymous/`
- 产品规格：`specs/jiaozhixing/`
- 两套待审核 ZIP：`pnpm build:submission`，输出到 `dist/submission/`
- 验证：`pnpm test:web-access`；启动本机 Server 并生成测试凭据后 `pnpm test:web-ui`。

真实教学数据、师生反馈、学校审核公章及实际云上访问核验尚需补齐，草稿不等于已盖章证明。

## 开源溯源

本仓库基于 Apache-2.0 开源 Agent 工作台改造。保留上游 `LICENSE` 与版权声明；产品展示名已变更为「教智星」。功能与风险说明见 [NOTICE.md](NOTICE.md)，第三方组件见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

内部工程包名/目录中可能仍保留历史技术标识，不代表对外产品品牌。

## 品牌检查

```bash
node scripts/check-no-zcode-brand.mjs
```
