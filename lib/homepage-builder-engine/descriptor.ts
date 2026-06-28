import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  HOMEPAGE_BUILDER_ENGINE_DRAFT_KEY,
  HOMEPAGE_BUILDER_ENGINE_HISTORY_KEY,
  HOMEPAGE_BUILDER_ENGINE_LIVE_KEY,
  HOMEPAGE_BUILDER_ENGINE_SETTINGS_KEY,
} from "@/lib/homepage-builder-engine/keys";
import { HOMEPAGE_BUILDER_API, HOMEPAGE_BUILDER_ROUTES } from "@/lib/homepage-builder-engine/registry";

const API_BASE = "/super-admin/homepage-builder";

export const HOMEPAGE_BUILDER_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "homepage-builder-engine",
  label: "Homepage Builder",
  icon: "🏠",
  description: "Visual CMS Pro v2 — enterprise homepage operating system",
  category: "platform",
  version: "2.0",
  autoRegister: true,
  baseHref: "/super-admin/homepage-builder",
  routes: HOMEPAGE_BUILDER_ROUTES,
  api: {
    snapshot: HOMEPAGE_BUILDER_API.snapshot,
    action: `${HOMEPAGE_BUILDER_API.snapshot}/action`,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "homepage_builder_enabled", label: "Homepage Builder", description: "Master homepage builder toggle", defaultEnabled: true },
    { id: "visual_editor_enabled", label: "Visual Editor", description: "Drag and drop section editor", defaultEnabled: true },
    { id: "live_preview_enabled", label: "Live Preview", description: "Multi-device preview modes", defaultEnabled: true },
    { id: "ai_assistant_enabled", label: "Homepage AI", description: "AI layout and optimization assistant", defaultEnabled: true },
    { id: "ab_testing_enabled", label: "A/B Testing", description: "Section experiments and rollout", defaultEnabled: true },
    { id: "schedule_publish_enabled", label: "Scheduled Publish", description: "Schedule homepage publishes", defaultEnabled: true },
    { id: "asset_integration_enabled", label: "Asset Integration", description: "Enterprise Asset Manager integration", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View homepage builder", roles: ["super-admin"] },
    { action: "edit", label: "Edit homepage sections", roles: ["super-admin"] },
    { action: "preview", label: "Preview homepage", roles: ["super-admin"] },
    { action: "duplicate", label: "Duplicate homepage", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish homepage", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback homepage", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
    { action: "delete", label: "Delete section", requiresMfa: true, roles: ["super-admin"] },
    { action: "schedule", label: "Schedule publish", roles: ["super-admin"] },
    { action: "approve", label: "Approve publish", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: HOMEPAGE_BUILDER_ENGINE_DRAFT_KEY,
    live: HOMEPAGE_BUILDER_ENGINE_LIVE_KEY,
    history: HOMEPAGE_BUILDER_ENGINE_HISTORY_KEY,
    settings: HOMEPAGE_BUILDER_ENGINE_SETTINGS_KEY,
  },
  relatedModules: [
    "visual-cms",
    "asset-manager",
    "enterprise-workflow-engine",
    "enterprise-module-registry-v2",
    "enterprise-core",
    "mission-control",
    "theme-studio",
    "homepage-enterprise-certification-engine",
  ],
};
