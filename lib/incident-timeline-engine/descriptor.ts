import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  INCIDENT_TIMELINE_DRAFT_KEY,
  INCIDENT_TIMELINE_HISTORY_KEY,
  INCIDENT_TIMELINE_LIVE_KEY,
  INCIDENT_TIMELINE_SETTINGS_KEY,
} from "@/lib/incident-timeline-engine/keys";
import { INCIDENT_TIMELINE_ROUTES } from "@/lib/incident-timeline-engine/registry";

const API_BASE = "/super-admin/incidents/timeline";

export const INCIDENT_TIMELINE_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "incident-timeline",
  label: "Incident Timeline",
  icon: "🕒",
  description: "Chronological audit-ready incident history",
  category: "operations",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/incidents/timeline",
  routes: INCIDENT_TIMELINE_ROUTES,
  api: {
    snapshot: `/api${API_BASE}`,
    action: `/api${API_BASE}/action`,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "live-timeline", label: "Live Timeline", description: "Real-time chronological incident view", defaultEnabled: true },
    { id: "integrity-verify", label: "Integrity Verification", description: "OMEGA integrity scans on timeline", defaultEnabled: true },
    { id: "timeline-export", label: "Timeline Export", description: "PDF, CSV, and XLSX exports", defaultEnabled: true },
    { id: "append-only", label: "Append-Only Records", description: "Immutable timeline record policy", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View timeline", roles: ["super-admin"] },
    { action: "export", label: "Export timeline", requiresMfa: true, roles: ["super-admin"] },
    { action: "verify-integrity", label: "Verify integrity", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
  ],
  configKeys: {
    draft: INCIDENT_TIMELINE_DRAFT_KEY,
    live: INCIDENT_TIMELINE_LIVE_KEY,
    history: INCIDENT_TIMELINE_HISTORY_KEY,
    settings: INCIDENT_TIMELINE_SETTINGS_KEY,
  },
  relatedModules: ["incident-command-center", "enterprise-compliance-center"],
};
