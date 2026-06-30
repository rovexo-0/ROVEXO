import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  ENTERPRISE_DEPLOYMENT_DRAFT_KEY,
  ENTERPRISE_DEPLOYMENT_HISTORY_KEY,
  ENTERPRISE_DEPLOYMENT_LIVE_KEY,
  ENTERPRISE_DEPLOYMENT_SETTINGS_KEY,
} from "@/lib/enterprise-deployment-center/keys";
import { DEPLOYMENT_CENTER_API, DEPLOYMENT_CENTER_ROUTES } from "@/lib/enterprise-deployment-center/registry";

const API_BASE = "/super-admin/deployment";

export const ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-deployment-center",
  label: "Deployment Center",
  icon: "🚀",
  description: "Production deployment gateway — validate, approve, deploy, and rollback",
  category: "platform",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/deployment",
  routes: DEPLOYMENT_CENTER_ROUTES,
  api: {
    snapshot: DEPLOYMENT_CENTER_API.snapshot,
    action: `${DEPLOYMENT_CENTER_API.snapshot}/action`,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "deployment_center_enabled", label: "Deployment Center", description: "Master deployment gateway toggle", defaultEnabled: true },
    { id: "blue_green_enabled", label: "Blue/Green Deployments", description: "Zero-downtime blue/green strategy", defaultEnabled: true },
    { id: "canary_enabled", label: "Canary Deployments", description: "Progressive canary rollouts", defaultEnabled: true },
    { id: "ai_validation_enabled", label: "AI Validation", description: "Enterprise AI release analysis", defaultEnabled: true },
    { id: "certification_gate_enabled", label: "Certification Gate", description: "Require certification before production", defaultEnabled: true },
    { id: "approval_workflow_enabled", label: "Approval Workflow", description: "MFA-gated manual approval", defaultEnabled: true },
    { id: "auto_rollback_enabled", label: "Auto Rollback", description: "Automatic rollback on failed post-deploy checks", defaultEnabled: true },
    { id: "release_notes_enabled", label: "Release Notes", description: "Auto-generate release notes", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View deployment center", roles: ["super-admin"] },
    { action: "build", label: "Trigger builds", roles: ["super-admin"] },
    { action: "validate", label: "Validate release", roles: ["super-admin"] },
    { action: "deploy", label: "Deploy release", requiresMfa: true, roles: ["super-admin"] },
    { action: "approve", label: "Approve release", requiresMfa: true, roles: ["super-admin"] },
    { action: "reject", label: "Reject release", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback", label: "Rollback deployment", requiresMfa: true, roles: ["super-admin"] },
    { action: "cancel", label: "Cancel deployment", requiresMfa: true, roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: ENTERPRISE_DEPLOYMENT_DRAFT_KEY,
    live: ENTERPRISE_DEPLOYMENT_LIVE_KEY,
    history: ENTERPRISE_DEPLOYMENT_HISTORY_KEY,
    settings: ENTERPRISE_DEPLOYMENT_SETTINGS_KEY,
  },
  relatedModules: [
    "enterprise-ai-operating-system",
    "enterprise-workflow-engine",
    "certification-center",
    "recovery-center",
    "audit-compliance-center",
    "enterprise-mobile-control-center",
    "homepage-builder-engine",
    "mission-control",
  ],
};
