import type { ReactNode } from "react";
import { cn } from "@/components/lib/utils.js";
import { useTeachingBridgeStore } from "@/store/teachingBridgeStore.js";

export function TeachingField({
  label,
  children,
  className,
  fieldId,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  /** 与 apply 结果 fieldIds 对齐，用于左侧闪动高亮。 */
  fieldId?: string;
}) {
  const focus = useTeachingBridgeStore((s) => s.focus);
  const flashing = Boolean(fieldId && focus?.fieldIds.includes(fieldId));
  return (
    <label
      data-teaching-field={fieldId}
      className={cn(
        "jzx-field flex flex-col gap-1.5 rounded-md transition-[box-shadow,background-color] duration-300",
        flashing && "jzx-field-flash",
        className,
      )}
    >
      <span className="text-ui-caption font-medium text-foreground-subtle">{label}</span>
      {children}
    </label>
  );
}

export function TeachingSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "jzx-section flex flex-col gap-3 rounded-xl border border-border bg-card/70 p-4",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-ui-lg font-medium">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-ui-caption text-foreground-subtle">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function TeachingToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "jzx-toolbar flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface/80 px-3 py-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TeachingKpi({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "brand";
}) {
  return (
    <div
      className={cn(
        "jzx-kpi rounded-xl border border-border bg-card p-4",
        tone === "warning" && "border-destructive/30",
        tone === "brand" && "border-brand/30",
      )}
    >
      <div className="text-ui-caption text-foreground-subtle">{label}</div>
      <div
        className={cn(
          "mt-1 text-ui-xl font-semibold tracking-tight",
          tone === "warning" && "text-destructive",
          tone === "brand" && "text-brand",
        )}
      >
        {value}
      </div>
    </div>
  );
}
