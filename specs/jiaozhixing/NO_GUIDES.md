# 教智星：关闭产品引导面

## 规则

教智星产品不展示任何引导/欢迎式页面，用户进入后直接可用主工作区。

| 面 | 行为 |
| --- | --- |
| 职业/UI 模式引导 `OccupationOnboarding` | 永不展示；静默写入教学默认偏好（办公模式、学生/教学职业） |
| 迁移引导 `OnboardingDialog` | 永不自动或手动打开 |
| Settings Sync 首启弹窗 | 视为已处理，不探测不弹窗 |
| 设置页「打开引导」入口 | 隐藏 |
| 教学工作台 | 默认直接进入教案编辑器详情，无总览/英雄引导页 |
| 首页 Z.ai / API Key 连接 | 启动与退出登录均不强制弹出；可在设置中自行配置供应商 |

## 状态所有者

- 开关：`packages/ui/src/teaching/productGuidePolicy.ts` 的 `PRODUCT_GUIDES_DISABLED`、`PRODUCT_STARTUP_PROVIDER_LOGIN_DISABLED`
- 偏好静默写入：`OccupationOnboarding` 在开关开启时一次性 `update` settings
- 工作台默认面板：`teachingWorkbenchStore.activePanel`（已有，默认 `lesson-editor`）
- 启动登录门禁：`shouldEnableProviderAvailabilityLoginEntryGuard()`

## 验收

1. 新用户/空记录启动不出现职业引导全屏页。
2. 不出现迁移/欢迎 Dialog。
3. 打开教学工作台直接看到教案编辑器，无「总览」阶段入口。
4. 无可用 Provider 时启动不进入 Z.ai / API Key 首页连接页。
5. `pnpm typecheck` / `pnpm lint` 通过。
