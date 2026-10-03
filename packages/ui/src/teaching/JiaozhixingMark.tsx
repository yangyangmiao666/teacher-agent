import { cn } from "@/components/lib/utils.js";

/**
 * 教智星标识：白底黑书，静态单书符号。
 */
export function JiaozhixingMark({
  className,
  animated: _animated = false,
}: {
  className?: string;
  /** 保留参数以兼容旧调用；黑白书标始终静态。 */
  animated?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="14" fill="#FFFFFF" />
      <rect x="1.25" y="1.25" width="61.5" height="61.5" rx="12.75" fill="none" stroke="#E5E7EB" />
      <path
        fill="#4B5563"
        d="M32 16.5c-4.2-1.6-9.4-2.2-14.8-1.2C12.4 16 9.5 18.2 9.5 21.2v24.2c0 2.2 1.9 3.7 4 3.1 5.6-1.5 11.2-1.8 16.5-.2.7.2 1.3.2 2 0 5.3-1.6 10.9-1.3 16.5.2 2.1.6 4-.9 4-3.1V21.2c0-3-2.9-5.2-7.7-5.9-5.4-1-10.6-.4-14.8 1.2Z"
      />
      <path d="M32 17.2v30.2" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M15.2 28.5h11.6M14.6 33.2h12.2M14.2 37.9h12.6"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.7"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M37.2 28.5h11.6M37.2 33.2h12.2M37.2 37.9h12.6"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.7"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
