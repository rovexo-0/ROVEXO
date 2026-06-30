import type { SuperAdminDashboardMetrics } from "@/lib/super-admin/dashboard";

export type SuperAdminDiagnosticsSnapshot = {
  metrics: SuperAdminDashboardMetrics;
  health: {
    status: string;
    version: string;
  };
  cron: {
    lastStatus: string | null;
  };
  errors: Array<{
    id: string;
    category: string;
    message: string;
  }>;
  environment: {
    nodeEnv: string;
  };
};
