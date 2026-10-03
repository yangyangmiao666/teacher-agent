# 教智星品牌规范

## 命名

| 用途 | 取值 |
| --- | --- |
| 中文产品名 | 教智星 |
| 英文展示名 | JiaoZhiXing |
| 短标识 | jzx |
| 演示工作区 | demo/jiaozhixing-course |

## 必须替换的表面

用户可见文案、窗口标题、README、建设说明书、Agent 人设与子代理 prompt、欢迎/登录/关于页、Logo alt 文案中，禁止出现原上游产品名（已禁用品牌字样）。

启动壳、favicon、侧栏与 Windows 左上角 Logo 统一使用教智星标识（`JiaozhixingMark` / `assets/jiaozhixing-mark.svg`）：白底深灰书、静态单书符号，不得再展示上游「Z」字形标、星芒或彩色动态标。

中文语境用「教智星」，英文语境用「JiaoZhiXing」。

## 主题色（学院蓝）

默认主题 `zai-light` / `zai-dark` 使用偏低饱和靛蓝（学院蓝），与灰阶界面、白底深灰书标同温；避免电光蓝与青绿混色。

| 主题 | 主按钮 `--color-primary` | 品牌强调 `--color-brand` | 弱强调面 `--color-accent` |
| --- | --- | --- | --- |
| zai-light | `#2f55d4` | `#2f55d4` | `#eef1fb` |
| zai-dark | `#5470e8` | `#6b86f0` | `#1a2240` |

教学工作台局部 `--jzx-pine` 直接跟随 `--color-brand`，不再与青绿混合。Logo 保持白底深灰书，不随主题色变化。

## 源码命名迁移（2026-10-03）

用户要求代码不含旧品牌字样。本次将自有源码、测试、配置和技能中的旧品牌大小驼峰标识统一迁移为 `JiaoZhiXing` / `jiaoZhiXing`，同步重命名含该字样的源码文件和所有引用。品牌门禁扫描整个自有代码树，检查标识符、注释和字符串，不再仅扫描展示文案。第三方版权及许可证原件完整保留；不能将基于开源的二次开发声明为全部底层代码原创。

本次不改变小写 npm scope、历史路径、协议线上的小写字段和持久化 key；这些是兼容接口，不是展示名称。所有进程必须使用同一版编译产物，旧编译产物不可混用。远端资源、签名及第三方接口不作机械替换。

## 工程兼容接口

以下内部标识可暂留，不对外文档宣传：

- npm scope `@zcode/*`
- 历史目录名如 `apps/zcode-cli`
- CSS/存储 key 中的 `zcode-` 前缀（主题等）

对外部署文档统一写 `JZX_*` 环境变量；运行时若仅存在遗留 `ZCODE_*`，可读作兼容别名，但文档与示例不以原上游产品名为展示品牌。

## 许可证

- 保留 Apache-2.0 `LICENSE` 与上游版权行（Z.AI Co., Ltd.）
- README / NOTICE 声明：本产品「教智星」基于开源 Agent 运行时改造，不暗示上游官方背书
- 不删除 `THIRD-PARTY-NOTICES.md`

## 检查

`node scripts/check-no-zcode-brand.mjs` 扫描对外表面（web 文案入口、i18n 用户串、README、demo、docs/submission）中的已禁用品牌字面量。
