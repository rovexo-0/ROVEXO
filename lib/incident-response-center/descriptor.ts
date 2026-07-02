import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  INCIDENT_RESPONSE_DRAFT_KEY,
  INCIDENT_RESPONSE_HISTORY_KEY,
  INCIDENT_RESPONSE_LIVE_KEY,
  INCIDENT_RESPONSE_SETTINGS_KEY,
} from "@/lib/incident-response-center/keys";
import { INCIDENT_RESPONSE_CENTER_API, INCIDENT_RESPONSE_CENTER_ROUTES } from "@/lib/incident-response-center/registry";

const API_BASE = "/super-admin/incidents";

export const INCIDENT_RESPONSE_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "incident-response-center",
  label: "Incident Response Center",
  icon: "🚨",
  description: "Enterprise incident management — detection, response, root cause, and postmortem",
  category: "operations",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/incidents",
  routes: INCIDENT_RESPONSE_CENTER_ROUTES,
  api: {
    snapshot: INCIDENT_RESPONSE_CENTER_API.snapshot,
    action: INCIDENT_RESPONSE_CENTER_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "enterprise_incident_center_v1", label: "Incident Response Center", description: "Master incident center toggle", defaultEnabled: true },
    { id: "live_incidents_enabled", label: "Live Incidents", description: "Real-time incident monitoring", defaultEnabled: true },
    { id: "ai_analysis_enabled", label: "AI Analysis", description: "SCAN, SENTINEL, OMEGA integration", defaultEnabled: true },
    { id: "playbooks_enabled", label: "Playbooks", description: "One-click incident response playbooks", defaultEnabled: true },
    { id: "automations_enabled", label: "Automations", description: "Auto assign, escalate, notify, recover", defaultEnabled: true },
    { id: "postmortem_enabled", label: "Postmortem Reports", description: "Automatic postmortem generation", defaultEnabled: true },
    { id: "emergency_mode_enabled", label: "Emergency Mode", description: "Platform emergency mode controls", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View incident center", roles: ["super-admin"] },
    { action: "acknowledge", label: "Acknowledge incident", roles: ["super-admin"] },
    { action: "escalate", label: "Escalate incident", requiresMfa: true, roles: ["super-admin"] },
    { action: "resolve", label: "Resolve incident", requiresMfa: true, roles: ["super-admin"] },
    { action: "reopen", label: "Reopen incident", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback", label: "Suggest rollback", requiresMfa: true, roles: ["super-admin"] },
    { action: "execute-playbook", label: "Execute playbook", requiresMfa: true, roles: ["super-admin"] },
    { action: "export", label: "Export incidents", requiresMfa: true, roles: ["super-admin"] },
    { action: "import", label: "Import incidents", requiresMfa: true, roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: INCIDENT_RESPONSE_DRAFT_KEY,
    live: INCIDENT_RESPONSE_LIVE_KEY,
    history: INCIDENT_RESPONSE_HISTORY_KEY,
    settings: INCIDENT_RESPONSE_SETTINGS_KEY,
  },
  relatedModules: [
    "incident-timeline",
    "incident-command-center",
    "enterprise-ai-operating-system",
    "enterprise-workflow-engine",
    "enterprise-deployment-center",
    "recovery-center",
    "certification-center",
    "operations-center",
    "mission-control",
  ],
};
