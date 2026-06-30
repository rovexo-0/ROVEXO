import type { ScanSeverity } from "@/lib/super-admin/operations/types";

export const SEVERITY_LABEL: Record<ScanSeverity, string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
};

export const SEVERITY_BADGE: Record<ScanSeverity, "success" | "warning" | "danger"> = {
  healthy: "success",
  warning: "warning",
  critical: "danger",
};

export const SEVERITY_DOT: Record<ScanSeverity, string> = {
  healthy: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.55)]",
  warning: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.55)]",
  critical: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.55)]",
};

export const SEVERITY_CARD: Record<ScanSeverity, string> = {
  healthy: "border-emerald-500/20 bg-emerald-500/[0.04]",
  warning: "border-amber-500/25 bg-amber-500/[0.05]",
  critical: "border-red-500/25 bg-red-500/[0.05]",
};
