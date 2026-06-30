import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  ENTERPRISE_BI_DRAFT_KEY,
  ENTERPRISE_BI_HISTORY_KEY,
  ENTERPRISE_BI_LIVE_KEY,
  ENTERPRISE_BI_SETTINGS_KEY,
} from "@/lib/enterprise-business-intelligence/keys";
import { ENTERPRISE_BI_API, ENTERPRISE_BI_ROUTES } from "@/lib/enterprise-business-intelligence/registry";

const API_BASE = "/super-admin/business-intelligence";

export const ENTERPRISE_BI_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-business-intelligence",
  label: "Business Intelligence Center",
  icon: "📊",
  description: "Executive analytics, KPI engine, forecasting, and decision-making platform",
  category: "insights",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/business-intelligence",
  routes: ENTERPRISE_BI_ROUTES,
  api: {
    snapshot: ENTERPRISE_BI_API.snapshot,
    action: ENTERPRISE_BI_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "enterprise_business_intelligence_v1", label: "Business Intelligence Center", description: "Master BI toggle", defaultEnabled: true },
    { id: "kpi_engine_enabled", label: "KPI Engine", description: "Real-time KPI calculations", defaultEnabled: true },
    { id: "ai_forecasting_enabled", label: "AI Forecasting", description: "SCAN, SENTINEL, OMEGA forecasts", defaultEnabled: true },
    { id: "live_updates_enabled", label: "Live Updates", description: "Real-time dashboard refresh", defaultEnabled: true },
    { id: "executive_reports_enabled", label: "Executive Reports", description: "Automated report generation", defaultEnabled: true },
    { id: "scheduled_reports_enabled", label: "Scheduled Reports", description: "Scheduled export delivery", defaultEnabled: true },
    { id: "visual_analytics_enabled", label: "Visual Analytics", description: "Charts, funnels, and leaderboards", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View BI center", roles: ["super-admin"] },
    { action: "refresh", label: "Refresh metrics", roles: ["super-admin"] },
    { action: "calculate", label: "Calculate KPIs", roles: ["super-admin"] },
    { action: "forecast", label: "Run forecast", roles: ["super-admin"] },
    { action: "export", label: "Export reports", requiresMfa: true, roles: ["super-admin"] },
    { action: "import", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: ENTERPRISE_BI_DRAFT_KEY,
    live: ENTERPRISE_BI_LIVE_KEY,
    history: ENTERPRISE_BI_HISTORY_KEY,
    settings: ENTERPRISE_BI_SETTINGS_KEY,
  },
  relatedModules: [
    "enterprise-ai-operating-system",
    "analytics-engine",
    "enterprise-deployment-center",
    "incident-response-center",
    "enterprise-security-operations-center",
    "recovery-center",
    "certification-center",
    "enterprise-mobile-control-center",
    "enterprise-workflow-engine",
    "enterprise-core",
    "mission-control",
  ],
};
