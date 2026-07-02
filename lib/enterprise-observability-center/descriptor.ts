import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  OBSERVABILITY_DRAFT_KEY,
  OBSERVABILITY_HISTORY_KEY,
  OBSERVABILITY_LIVE_KEY,
  OBSERVABILITY_SETTINGS_KEY,
} from "@/lib/enterprise-observability-center/keys";
import { OBSERVABILITY_API, OBSERVABILITY_ROUTES } from "@/lib/enterprise-observability-center/registry";

const API_BASE = "/super-admin/observability";

export const OBSERVABILITY_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-observability-center",
  label: "Enterprise Observability Center",
  icon: "📡",
  description: "Enterprise Monitoring Platform — real-time visibility into health, performance, telemetry, diagnostics, and operational status across the entire ROVEXO ecosystem",
  category: "operations",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/observability",
  routes: OBSERVABILITY_ROUTES,
  api: {
    snapshot: OBSERVABILITY_API.snapshot,
    action: OBSERVABILITY_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "enterprise_observability_center_v1", label: "Enterprise Observability Center", description: "Master observability toggle", defaultEnabled: true },
    { id: "live_monitoring_enabled", label: "Live Monitoring", description: "Continuous subsystem monitoring", defaultEnabled: true },
    { id: "telemetry_capture_enabled", label: "Telemetry Capture", description: "Real-time telemetry collection", defaultEnabled: true },
    { id: "alert_engine_enabled", label: "Smart Alert Engine", description: "Automatic anomaly detection", defaultEnabled: true },
    { id: "topology_map_enabled", label: "Topology Map", description: "Live infrastructure topology", defaultEnabled: true },
    { id: "diagnostics_engine_enabled", label: "Diagnostics Engine", description: "Automated diagnostic scans", defaultEnabled: true },
    { id: "capacity_planning_enabled", label: "Capacity Planning", description: "Growth and scaling forecasts", defaultEnabled: true },
    { id: "omega_integration_enabled", label: "OMEGA Integration", description: "Feed health and telemetry to OMEGA", defaultEnabled: true },
    { id: "read_only_monitoring", label: "Read-Only Monitoring", description: "Never modify protected subsystems", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View observability center", roles: ["super-admin"] },
    { action: "monitor", label: "Run platform monitoring", roles: ["super-admin"] },
    { action: "telemetry", label: "Capture telemetry", roles: ["super-admin"] },
    { action: "diagnose", label: "Run diagnostics", roles: ["super-admin"] },
    { action: "alerts", label: "Scan alerts", roles: ["super-admin"] },
    { action: "sync-omega", label: "Sync with OMEGA", roles: ["super-admin"] },
    { action: "export", label: "Export reports", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: OBSERVABILITY_DRAFT_KEY,
    live: OBSERVABILITY_LIVE_KEY,
    history: OBSERVABILITY_HISTORY_KEY,
    settings: OBSERVABILITY_SETTINGS_KEY,
  },
  relatedModules: [
    "omega-command-center",
    "omega-quality-assurance-center",
    "omega-development-director",
    "enterprise-governance-center",
    "enterprise-security-operations-center",
    "incident-response-center",
    "enterprise-business-intelligence",
    "enterprise-deployment-center",
    "certification-center",
    "operations-center",
    "enterprise-module-registry-v2",
    "enterprise-automation-hub",
    "enterprise-e2e-validation-engine",
    "enterprise-autonomous-execution-engine",
  ],
};
