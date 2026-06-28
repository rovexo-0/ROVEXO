import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  LAUNCH_READINESS_DRAFT_KEY,
  LAUNCH_READINESS_HISTORY_KEY,
  LAUNCH_READINESS_LIVE_KEY,
  LAUNCH_READINESS_SETTINGS_KEY,
} from "@/lib/enterprise-launch-readiness-engine/keys";
import { LAUNCH_READINESS_API, LAUNCH_READINESS_ROUTES } from "@/lib/enterprise-launch-readiness-engine/registry";

const API_BASE = "/super-admin/launch-readiness";

export const LAUNCH_READINESS_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-launch-readiness-engine",
  label: "Enterprise Launch Readiness",
  icon: "🚀",
  description: "Final operational readiness layer — validates infrastructure, operations, security, performance and enterprise compliance before every production release",
  category: "operations",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/launch-readiness",
  routes: LAUNCH_READINESS_ROUTES,
  api: {
    snapshot: LAUNCH_READINESS_API.snapshot,
    action: LAUNCH_READINESS_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "enterprise_launch_readiness_engine_v1", label: "Launch Readiness Engine", description: "Master launch readiness toggle — Prompt 068", defaultEnabled: true },
    { id: "infrastructure_validation_enabled", label: "Infrastructure Validation", description: "Email, cron, queue, health, deployment", defaultEnabled: true },
    { id: "pwa_validation_enabled", label: "PWA Validation", description: "Manifest, service worker, offline mode", defaultEnabled: true },
    { id: "push_validation_enabled", label: "Push Validation", description: "Web push, FCM, APNs readiness", defaultEnabled: true },
    { id: "performance_validation_enabled", label: "Performance Validation", description: "Core Web Vitals, bundle, latency", defaultEnabled: true },
    { id: "security_validation_enabled", label: "Security Validation", description: "Auth, RBAC, rate limits, headers", defaultEnabled: true },
    { id: "marketplace_validation_enabled", label: "Marketplace Validation", description: "Homepage, categories, search, listings", defaultEnabled: true },
    { id: "launch_auto_repair_enabled", label: "Auto Repair", description: "Safe operational repairs with governance gates", defaultEnabled: true },
    { id: "validation_only_mode", label: "Validation Only", description: "Never auto-modify business logic or production data", defaultEnabled: true },
    { id: "require_pass_100", label: "Require PASS 100%", description: "Production blocked until launch gate PASS 100%", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View launch readiness", roles: ["super-admin"] },
    { action: "validate", label: "Run launch validation", roles: ["super-admin"] },
    { action: "repair", label: "Run auto repair", requiresMfa: true, roles: ["super-admin"] },
    { action: "certify", label: "Grant launch certification", requiresMfa: true, roles: ["super-admin"] },
    { action: "export", label: "Export launch reports", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
  ],
  configKeys: {
    draft: LAUNCH_READINESS_DRAFT_KEY,
    live: LAUNCH_READINESS_LIVE_KEY,
    history: LAUNCH_READINESS_HISTORY_KEY,
    settings: LAUNCH_READINESS_SETTINGS_KEY,
  },
  relatedModules: [
    "omega-command-center",
    "omega-quality-assurance-center",
    "omega-development-director",
    "enterprise-observability-center",
    "enterprise-governance-center",
    "enterprise-security-operations-center",
    "certification-center",
    "enterprise-deployment-center",
    "homepage-enterprise-certification-engine",
    "omega-global-ui-integrity-engine",
    "enterprise-e2e-validation-engine",
    "enterprise-autonomous-execution-engine",
    "mission-control-engine",
  ],
};
