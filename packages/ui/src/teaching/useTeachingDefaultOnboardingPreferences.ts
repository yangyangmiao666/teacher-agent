import { useEffect, useRef } from "react";
import type { AppSettings } from "@zcode/shared";
import { logger } from "@/logger.js";
import {
  PRODUCT_GUIDES_DISABLED,
  TEACHING_DEFAULT_ONBOARDING,
} from "@/teaching/productGuidePolicy.js";

/** 教智星关闭引导面时，静默写入教学默认偏好（仅一次）。 */
export function useTeachingDefaultOnboardingPreferences(options: {
  settings: AppSettings | null | undefined;
  setInterfaceMode: (mode: "office" | "coding") => void;
  update: (patch: Partial<AppSettings>) => Promise<void>;
}): void {
  const { settings, setInterfaceMode, update } = options;
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!PRODUCT_GUIDES_DISABLED || !settings || appliedRef.current) return;
    if (settings.onboardingOccupation) {
      appliedRef.current = true;
      return;
    }
    appliedRef.current = true;
    setInterfaceMode(TEACHING_DEFAULT_ONBOARDING.interfaceMode);
    void update({
      onboardingOccupation: TEACHING_DEFAULT_ONBOARDING.onboardingOccupation,
      memoryEnabled: TEACHING_DEFAULT_ONBOARDING.memoryEnabled,
      proactiveSuggestionsEnabled: TEACHING_DEFAULT_ONBOARDING.proactiveSuggestionsEnabled,
    }).catch((cause: unknown) => {
      appliedRef.current = false;
      logger.warn("[occupation-onboarding] 静默写入教学默认偏好失败", { error: String(cause) });
    });
  }, [settings, setInterfaceMode, update]);
}
