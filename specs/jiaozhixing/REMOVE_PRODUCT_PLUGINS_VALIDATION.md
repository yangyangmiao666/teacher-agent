# 插件移除验证记录

2026-10-03，本地 macOS，Node 24.14.0。

## 实现范围

删除插件商店、安装管理、推荐和引用选择、状态与同步服务、Agent 协议、CLI 命令、启动发现/加载、插件配置字段、内置插件包以及打包接线。删除旧源文件对应的编译副本，重新生成 Web、Server、CLI、桌面暂存 Agent 和 `dist/jzx` 测试包。

技能、MCP、子智能体和 Hooks 使用原生接口；15 项办公技能及 353 个资源文件继续独立部署。保留用户历史目录，不读取或执行其插件配置。编译、编辑器和 Markdown 库的技术扩展继续用于渲染。

## 实际执行结果

| 检查                                   | 结果                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm typecheck`                       | 通过                                                                                             |
| CLI 各包 TypeScript 构建               | 通过                                                                                             |
| `pnpm architecture:check`              | 通过，0 违规                                                                                     |
| CLI、Server、Web 构建及运行目录暂存    | 通过                                                                                             |
| `pnpm test:no-plugins`                 | 通过；专用模块/接线消失，打包 CLI 正常启动，旧 `plugins list` 命令返回 Unknown command，退出码 1 |
| `pnpm test:web-no-plugins`             | 通过；对话仍挂载，无插件按钮或测试入口，技能/MCP 设置保留                                        |
| `pnpm test:teaching-canvas`            | 12 项通过                                                                                        |
| `pnpm test:teaching-courseware`        | 8 项通过                                                                                         |
| `pnpm test:teaching-workspace`         | 5 项通过                                                                                         |
| `pnpm test:web-access`                 | 4 项通过                                                                                         |
| `pnpm test:web-ui`                     | 通过；七个页面、清洁开场、草稿持久化、可编辑 PPT 下载和手机布局                                  |
| `pnpm test:web-canvas`                 | 通过；Markdown、KaTeX、Mermaid、隔离 HTML、官方 A2UI 数据绑定、回传、撤销与持久化                |
| `pnpm test:web-teaching-workspace`     | 通过；左侧真实 PPT 页导航、缓存/服务端预览、工作区隔离及手机布局                                 |
| `pnpm test:web-visual-components`      | 通过；六类 ECharts SVG、点击回填、表单保存、A2UI 增量更新和 reduced motion                       |
| `pnpm test:office-skills`              | 通过；临时目录中加载打包后的 15 项技能，不依赖仓库 cwd                                           |
| `node scripts/check-office-skills.mjs` | 通过，353 个资源文件                                                                             |

浏览器回归使用完成态测试夹具和实际文件导出/预览，不代表已调用模型完成真实课堂教学。数据为模拟教学材料，未加入真实师生或企业数据。

## 未通过及环境限制

- `pnpm lint`：81 个警告、1 个错误。错误是未修改的 `packages/server/src/remote/ssh-backend.ts:613` 超出 max-lines（511/400）；该文件工作区 diff 为空。未将此检查记为通过。
- 额外执行 `tsc -b packages/desktop` 未通过，输出 216 条诊断，涉及 Desktop 的 rootDir/include、DOM 类型、Electron/Window 声明与其他类型错误；不能据此声明完整桌面发行版通过验证。必需的根类型检查、Web 和 CLI 检查结果如上。
- 工作区没有 HEAD 提交；freshness 和 `architecture:check --changed` 因无法解析 HEAD 失败。已执行全量架构检查，未更新或绕过基线。

修复过程中发现移除产品插件曾误删 Markdown 技术扩展接线和混合 UI 父节点；已恢复公式/Mermaid、会话、终端和 Git 分支切换组件，并执行上述回归。
