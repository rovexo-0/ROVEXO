import type {
  PremiumActivityItem,
  PremiumAlert,
  PremiumKpiCard,
} from "@/lib/super-admin/premium/types";

export type EnterpriseDashboardStandardData = {
  kpis?: PremiumKpiCard[];
  chartValues?: number[];
  chartLabel?: string;
  recentActivity?: PremiumActivityItem[];
  alerts?: PremiumAlert[];
  pendingActions?: Array<{ id: string; label: string; href?: string }>;
  auditSummary?: Array<{ id: string; action: string; timestamp: string }>;
  timeline?: Array<{ id: string; label: string; timestamp: string }>;
  aiInsights?: string[];
  quickActions?: Array<{ label: string; href: string }>;
};

export function createDefaultEnterpriseDashboard(moduleLabel: string): EnterpriseDashboardStandardData {
  return {
    kpis: [
      { id: "health", label: "Health", value: "100", unit: "%", status: "healthy" },
      { id: "uptime", label: "Uptime", value: "99.9", unit: "%", status: "healthy" },
      { id: "latency", label: "Latency", value: "42", unit: "ms", status: "healthy" },
      { id: "modules", label: "Modules", value: moduleLabel, status: "healthy" },
    ],
    chartValues: [12, 18, 14, 22, 19, 24, 21],
    chartLabel: "7-day activity",
    aiInsights: [`${moduleLabel} is OMEGA Ready and enterprise certified.`],
    quickActions: [],
    recentActivity: [],
    alerts: [],
    pendingActions: [],
    auditSummary: [],
    timeline: [],
  };
}
