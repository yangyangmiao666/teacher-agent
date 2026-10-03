# Jarvis 办公技能迁移

迁移范围：docx、xlsx、pptx、pdf、doc-coauthoring、internal-comms、data-analysis、data-visualization、matplotlib、matplotlib-chinese-font、echarts-ai-skill、canvas-design、brand-guidelines、theme-factory、web-artifacts-builder。软件开发、金融投资、Slack GIF 等不属于本次办公范围。

唯一资产源为 apps/zcode-cli/packages/bundled-skills/skills，复用现有 bundled skills discovery、runtime 按需加载和发行目录复制；不增加第二份 workspace 技能。项目/用户同名技能继续优先于内置。技能可以自然语言调用，内置包按既有规则不进入用户管理或 $ 引用面板。

保留技能全文、脚本、模板、字体及 LICENSE；过滤 node_modules、缓存、.DS_Store。office-migration.json 逐文件记录 Jarvis 原始 SHA-256 与迁入版本 SHA-256，校验脚本验证内容与必要入口，无源仓库依赖。适配说明放在技能正文开头：以技能根为相对路径基准、输出到 workspace/outputs/office、不得发送真实学生/企业信息到外部执行服务；Office 二进制生成在 Agent 服务端执行，网页教学 PPT 编辑器仍由已有 store 拥有。

适配边界：data-visualization 使用本地 Python 替代 infsh 登录与远程执行；brand-guidelines 默认遵循教智星/学校品牌而非强制 Anthropic；中文字体兼顾 Noto Sans CJK SC 与 macOS/Windows；文档作者默认教智星。HTML 文档可独立生成，已有智能画布仍保持自身 sandbox 与无外网脚本契约。

Linux Web 镜像提供 Python venv、LibreOffice、Poppler、Pandoc、Tesseract 中文 OCR、中文字体及 Python 文档/图表依赖；Node 文档工具独立安装，不进入 Web 前端。ECharts 自带 TypeScript CLI 在构建时编译。依赖缺失应明确报错，不伪称已经生成文件，不改变 Agent/Host 会话及权限边界。

验收：15个技能能通过正式 CLI discover/load；所有资产摘要一致、迁移脚本 Python 语法可编译；实际生成并读取 DOCX/XLSX/PPTX/PDF，执行迁入的 Office 验证脚本；构建产物完整保留技能；typecheck/lint/全量架构检查真实执行。Docker daemon 不可用时记录镜像未实际构建，不将配置校验写成容器通过。

打包调查确认：build-zcode.mjs 原先仅 stage Agent JS/provider，未 stage bundled-skills。修复为将同一技能包递归复制到 agent/packages/bundled-skills（bootstrap 现有候选目录）；Desktop/远端 staging 白名单同步包含 requirements 与迁移清单。构建后在仓库外的临时目录执行正式 CLI list，确认不依赖 monorepo 路径仍能发现15个办公技能。

## 本轮验证记录

- 15个入口、353个迁移资产摘要通过；57个 Python 脚本语法通过。
- 四种办公文件实际生成与回读；迁入的 PPTX 验证器、Excel 重算器通过；DOCX 夹具最初缺少 zoom.percent，被迁入验证器准确识别，补齐夹具后重验。
- ECharts TypeScript CLI 构建，推荐/option生成/SVG导出通过。
- Web发行包在仓库外发现与逐个完整加载验证；用户同名覆盖仅在临时测试配置中禁用，不修改真实用户配置。
- 镜像依赖已配置，本机未实际构建Docker镜像，不能视为云端上线验证。

补充验证发现 Jarvis 的 xlsx/recalc.py 宏执行路径曾报告 success，但公式缓存 B4 仍为空。迁入版改用临时隔离 LibreOffice profile 转换到临时输出目录，核验每个公式存在计算缓存后才原子替换源文件；失败保留原文件，返回非零退出码和结构化错误。新增验收：AVERAGE(80,90) 缓存必须等于85，不以进程返回0代替重算结果。
