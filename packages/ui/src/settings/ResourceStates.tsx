import type { ReactNode } from "react";
export function ResourceLoadingState({ label }: { label: string }) {
  return (
    <p role="status" className="py-8 text-center text-foreground-subtle">
      {label}
    </p>
  );
}
export function ResourceSearchEmptyState({ label }: { label: string }) {
  return <p className="py-8 text-center text-foreground-subtle">{label}</p>;
}
export function ResourceInstallEmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border px-6 py-8 text-center">
      <p className="font-medium">{title}</p>
      {description ? <p className="text-foreground-subtle">{description}</p> : null}
      {actions}
    </div>
  );
}
