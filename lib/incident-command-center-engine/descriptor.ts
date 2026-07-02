import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  INCIDENT_COMMAND_CENTER_DRAFT_KEY,
  INCIDENT_COMMAND_CENTER_CONFIG_HISTORY_KEY,
  INCIDENT_COMMAND_CENTER_LIVE_KEY,
  INCIDENT_COMMAND_CENTER_SETTINGS_KEY,
} from "@/lib/incident-command-center-engine/keys";
import { INCIDENT_COMMAND_ROUTES } from "@/lib/incident-command-center-engine/registry";

const API_BASE = "/super-admin/mobile/incidents";

export const INCIDENT_COMMAND_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "incident-command-center",
  label: "Incident Command Center",
  icon: "🚨",
  description: "Notification and incident command",
  category: "operations",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/mobile/incidents",
  routes: INCIDENT_COMMAND_ROUTES,
  api: {
    snapshot: `/api${API_BASE}`,
    action: `/api${API_BASE}/action`,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "live-dashboard", label: "Live Dashboard", description: "Real-time incident dashboard", defaultEnabled: true },
    { id: "emergency-actions", label: "Emergency Actions", description: "Maintenance mode and emergency lock controls", defaultEnabled: true },
    { id: "ori-analysis", label: "ORI Analysis", description: "AI incident root-cause analysis", defaultEnabled: true },
    { id: "push-notifications", label: "Push Notifications", description: "Critical and security push channels", defaultEnabled: true },
    { id: "report-export", label: "Report Export", description: "Incident and executive report generation", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View incidents", roles: ["super-admin"] },
    { action: "acknowledge", label: "Acknowledge incident", roles: ["super-admin"] },
    { action: "assign", label: "Assign incident", roles: ["super-admin"] },
    { action: "close", label: "Close incident", roles: ["super-admin"] },
    { action: "maintenance-mode", label: "Maintenance mode", requiresMfa: true, requiresBiometric: true, roles: ["super-admin"] },
    { action: "emergency-lock", label: "Emergency lock", requiresMfa: true, requiresBiometric: true, roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
  ],
  configKeys: {
    draft: INCIDENT_COMMAND_CENTER_DRAFT_KEY,
    live: INCIDENT_COMMAND_CENTER_LIVE_KEY,
    history: INCIDENT_COMMAND_CENTER_CONFIG_HISTORY_KEY,
    settings: INCIDENT_COMMAND_CENTER_SETTINGS_KEY,
  },
  relatedModules: ["incident-timeline", "enterprise-compliance-center", "omega-enterprise-mobile", "executive-command"],
};
