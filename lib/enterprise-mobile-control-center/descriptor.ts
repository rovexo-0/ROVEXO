import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  ENTERPRISE_MOBILE_CC_DRAFT_KEY,
  ENTERPRISE_MOBILE_CC_HISTORY_KEY,
  ENTERPRISE_MOBILE_CC_LIVE_KEY,
  ENTERPRISE_MOBILE_CC_SETTINGS_KEY,
} from "@/lib/enterprise-mobile-control-center/keys";
import { MOBILE_CC_API, MOBILE_CC_ROUTES } from "@/lib/enterprise-mobile-control-center/registry";

const API_BASE = "/super-admin/mobile";

export const ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-mobile-control-center",
  label: "Mobile Control Center",
  icon: "📱",
  description: "Super Admin mobile app lifecycle — builds, releases, OTA, devices, push",
  category: "platform",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/mobile",
  routes: MOBILE_CC_ROUTES,
  api: {
    snapshot: MOBILE_CC_API.snapshot,
    action: `${MOBILE_CC_API.snapshot}/action`,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "mobile_cc_enabled", label: "Mobile Control Center", description: "Master mobile control toggle", defaultEnabled: true },
    { id: "android_builds_enabled", label: "Android Builds", description: "Android build pipeline", defaultEnabled: true },
    { id: "ios_builds_enabled", label: "iOS Builds", description: "iOS and TestFlight builds", defaultEnabled: true },
    { id: "ota_updates_enabled", label: "OTA Updates", description: "Over-the-air update rollouts", defaultEnabled: true },
    { id: "push_center_enabled", label: "Push Center", description: "Mobile push notifications", defaultEnabled: true },
    { id: "device_management_enabled", label: "Device Management", description: "Remote device administration", defaultEnabled: true },
    { id: "ai_monitoring_enabled", label: "AI Monitoring", description: "Enterprise AI mobile insights", defaultEnabled: true },
    { id: "approval_workflow_enabled", label: "Approval Workflow", description: "MFA-gated publish approvals", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View mobile control center", roles: ["super-admin"] },
    { action: "build", label: "Trigger builds", roles: ["super-admin"] },
    { action: "publish", label: "Publish release", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback", label: "Rollback release", requiresMfa: true, roles: ["super-admin"] },
    { action: "send-push", label: "Send push notification", requiresMfa: true, roles: ["super-admin"] },
    { action: "create-ota", label: "Create OTA update", requiresMfa: true, roles: ["super-admin"] },
    { action: "remote-logout", label: "Remote logout device", requiresMfa: true, roles: ["super-admin"] },
    { action: "disable-device", label: "Disable device", requiresMfa: true, roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: ENTERPRISE_MOBILE_CC_DRAFT_KEY,
    live: ENTERPRISE_MOBILE_CC_LIVE_KEY,
    history: ENTERPRISE_MOBILE_CC_HISTORY_KEY,
    settings: ENTERPRISE_MOBILE_CC_SETTINGS_KEY,
  },
  relatedModules: [
    "mobile-distribution-center",
    "device-lifecycle-manager",
    "enterprise-ai-operating-system",
    "enterprise-workflow-engine",
    "certification-center",
    "recovery-center",
    "audit-compliance-center",
    "omega-enterprise-mobile",
  ],
};
