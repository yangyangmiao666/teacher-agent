# 教智星办公技能

从本地 Open-Jarvis 迁入15个办公技能，保留脚本、参考资料、字体、模板与许可证。迁移清单为 `apps/zcode-cli/packages/bundled-skills/office-migration.json`，按文件记录源摘要与适配后摘要。

| 工作 | 技能 |
| --- | --- |
| Word报告、教案材料、修订批注 | docx |
| Excel成绩表、公式重算、数据整理 | xlsx |
| 完整PPT制作、模板编辑、讲稿与检查 | pptx |
| PDF提取、合并、表单、OCR | pdf |
| 方案、说明书、校内汇报 | doc-coauthoring、internal-comms |
| 学情数据分析与图表 | data-analysis、data-visualization、matplotlib、matplotlib-chinese-font、echarts-ai-skill |
| 文档主题、品牌、海报及交互报告 | theme-factory、brand-guidelines、canvas-design、web-artifacts-builder |

新建智能体对话后直接提出任务，例如“把这份脱敏成绩表整理成 Excel，保留计算公式”“按当前教案制作完整 PPT 并附逐页讲稿”“生成 Word 版课程建设说明书”。内置技能由 Agent 按需加载；同名项目/用户技能沿用现有优先级。它们按已有内置包规则不出现在用户技能管理/删除列表。产物默认放在工作区 `outputs/office/`；智能体需要返回实际路径，不应只展示大纲并声称文件已生成。

办公文件在 Agent 所在机器处理。Linux 部署镜像已声明 Python venv、LibreOffice、Poppler、Pandoc、Tesseract 中文OCR与字体及Node文档工具；需要重新构建镜像才能安装。桌面开发环境请为执行环境配置这些工具，Python依赖清单见 `apps/zcode-cli/packages/bundled-skills/office-requirements.txt`。ECharts独立CLI在技能目录运行 `npm install && npm run build`。缺失依赖时如实报错；浏览器PPT编辑器的本地下载不依赖这些服务端Python工具。

`pnpm check:office-skills` 校验353个原始迁移文件及15个入口。构建 `pnpm build:jzx` 后执行 `pnpm test:office-skills`，在仓库外临时工作区验证发行包发现与完整加载（测试期间只在该临时工作区屏蔽同名用户版本）。

所有教学示例采用虚构/脱敏数据，不自动调用外部远程执行服务。HTML报告是独立文档；嵌入教学画布时遵守已有sandbox，不能直接使用带外部脚本的报告HTML。

安装 Python 办公依赖后，可执行 `python3 scripts/test-office-recalc.py` 验证真实公式缓存与失败保留源文件。
