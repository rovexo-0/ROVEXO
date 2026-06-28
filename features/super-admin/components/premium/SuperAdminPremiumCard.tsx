import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PremiumHealthStatus } from "@/lib/super-admin/premium/types";

type SuperAdminStatusBadgeProps = {
  label: string;
  status?: PremiumHealthStatus;
  omega?: boolean;
};

const STATUS_CLASS: Record<PremiumHealthStatus, string> = {
  healthy: "sa-premium-badge--healthy",
  warning: "sa-premium-badge--warning",
  critical: "sa-premium-badge--critical",
  info: "sa-premium-badge--healthy",
};

export function SuperAdminStatusBadge({ label, status = "healthy", omega }: SuperAdminStatusBadgeProps) {
  return (
    <span className={cn("sa-premium-badge", omega ? "sa-premium-badge--omega" : STATUS_CLASS[status])}>
      {omega ? "OMEGA Ready" : label}
    </span>
  );
}

type SuperAdminPremiumCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  status?: PremiumHealthStatus;
};

export function SuperAdminPremiumCard({ label, value, hint, status }: SuperAdminPremiumCardProps) {
  return (
    <div className="sa-premium-card">
      <span className="sa-premium-card__label">{label}</span>
      <strong className="sa-premium-card__value">{value}</strong>
      {hint ? <small className="text-xs text-text-muted">{hint}</small> : null}
      {status ? <SuperAdminStatusBadge label={status} status={status} /> : null}
    </div>
  );
}
