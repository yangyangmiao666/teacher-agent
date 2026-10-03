/**
 * 教智星产品引导面策略。
 * 开启后：职业引导、迁移引导、首启同步弹窗均不展示。
 */
export const PRODUCT_GUIDES_DISABLED = true;

/**
 * 关闭启动首页的 Provider / Z.ai / API Key 连接门禁。
 * 用户可稍后在设置中配置模型供应商；不影响会话过期后的手动登录。
 */
export const PRODUCT_STARTUP_PROVIDER_LOGIN_DISABLED = true;

/**
 * 模型配置不展示任何套餐（体验 / 个人 Coding Plan / 团队套餐）。
 * 仅保留自定义供应商与 API Key 配置路径。
 */
export const PRODUCT_MODEL_PROVIDER_PLANS_DISABLED = true;

/** 静默跳过引导时写入的教学默认偏好。 */
export const TEACHING_DEFAULT_ONBOARDING = {
  onboardingOccupation: "student" as const,
  interfaceMode: "office" as const,
  memoryEnabled: true,
  proactiveSuggestionsEnabled: true,
};
