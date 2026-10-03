import { JiaozhixingMark } from "@/teaching/JiaozhixingMark.js";
import { cn } from "@/components/lib/utils.js";

/** 关于页 / 引导欢迎区品牌标，已切换为教智星。 */
export function JiaoZhiXingAboutLogo({ className }: { className?: string }) {
  return <JiaozhixingMark className={cn("h-auto w-10", className)} />;
}

/** 字标占位：保留组件名以兼容旧引用，视觉改为教智星星芒+文案由调用方负责。 */
export function JiaoZhiXingWordmarkLogo({ className }: { className?: string }) {
  return <JiaozhixingMark className={cn("h-auto w-28", className)} />;
}
