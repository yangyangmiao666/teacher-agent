# 教智星：模型配置不展示套餐

## 规则

设置页「模型配置 / Model Provider」不展示任何套餐面，用户仅通过自定义供应商（API Key / 自建 endpoint）配置模型。

| 面 | 行为 |
| --- | --- |
| 侧栏预置 Z.ai / BigModel / Start Plan | 不展示 |
| 连接方式切换（体验 / 个人 / 团队套餐） | 不展示 |
| Coding Plan / Start Plan / Team Plan 状态卡、购买、升级 | 不展示 |
| 自定义供应商（API Key） | 保留，可增删改与测通 |
| 对话无可用模型横幅 | 只提示配置模型，不出现编程套餐或升级购买按钮 |

## 状态所有者

- 开关：`packages/ui/src/teaching/productGuidePolicy.ts` 的 `PRODUCT_MODEL_PROVIDER_PLANS_DISABLED`
- 导航过滤：`useModelProviderNavigation`（预置组与 codingPlan/teamPlan 项为空）
- 详情：`ModelProviderSectionDetail` 不渲染套餐切换与套餐状态面板

## 验收

1. 打开设置 → 模型配置，侧栏无 Z.ai / BigModel / Start Plan / Coding Plan / 团队套餐入口。
2. 详情区无「体验套餐 / 个人套餐 / 团队套餐」切换与购买卡片。
3. 仍可添加自定义供应商并编辑模型。
4. `pnpm typecheck` / `pnpm lint` 通过。
5. 未配置供应商的七教学子台仅显示“请在模型设置中配置教学模型”和配置按钮；E2E 核验无“编程套餐”“升级”入口。
