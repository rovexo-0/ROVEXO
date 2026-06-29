import { ENTERPRISE_CORE_REGISTRY } from "@/lib/enterprise-core/registry";
import { listEnterpriseModuleDescriptors } from "@/lib/enterprise-architecture/registry";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import {
  MODULE_DEPENDENCY_HINTS,
  resolveModuleCategory,
} from "@/lib/enterprise-module-registry-v2/registry";
import type {
  EnterpriseModuleV2Descriptor,
  ModuleHealthLevel,
  ModuleLifecycleState,
  RegistryV2ProviderRef,
} from "@/lib/enterprise-module-registry-v2/types";

const now = () => new Date().toISOString();

function provider(id: string, label: string, endpoint?: string): RegistryV2ProviderRef {
  return { id, label, endpoint, enabled: true };
}

function healthFromCore(health: string): ModuleHealthLevel {
  if (health === "healthy") return "healthy";
  if (health === "warning") return "warning";
  if (health === "critical") return "critical";
  return "unknown";
}

function finalizeDescriptor(
  module: Omit<
    EnterpriseModuleV2Descriptor,
    "displayName" | "configurationSchema" | "healthProvider" | "widgets" | "assets" | "lastBuild" | "lastPublish"
  >,
): EnterpriseModuleV2Descriptor {
  const settingsSchema = module.settingsSchema;
  return {
    ...module,
    displayName: module.moduleName,
    configurationSchema: settingsSchema,
    healthProvider: provider(`${module.moduleId}-health`, "Health Provider", module.healthEndpoint),
    widgets: [{ id: `${module.moduleId}-dashboard`, label: "Dashboard", href: module.baseHref }],
    assets: [`styles/rovexo/${module.moduleId}.css`],
    lastBuild: module.updatedAt,
    lastPublish: null,
    featureFlags: module.featureFlags.map((flag) => ({ scope: "module" as const, ...flag })),
  };
}

function synthesizeFromRichDescriptor(
  rich: EnterpriseModuleDescriptor,
  lifecycle: ModuleLifecycleState = "ready",
): EnterpriseModuleV2Descriptor {
  const category = resolveModuleCategory(rich.id);
  return finalizeDescriptor({
    moduleId: rich.id,
    moduleName: rich.label,
    category,
    version: rich.version,
    description: rich.description,
    owner: "ROVEXO Enterprise",
    icon: rich.icon,
    dependencies: MODULE_DEPENDENCY_HINTS[rich.id] ?? [...(rich.relatedModules ?? [])],
    routes: [...rich.routes],
    navigation: [{ id: rich.id, label: rich.label, href: rich.baseHref, icon: rich.icon }],
    permissions: [...rich.permissions],
    featureFlags: rich.featureFlags.map((flag) => ({ ...flag })),
    settingsSchema: {
      draftKey: rich.configKeys.draft,
      liveKey: rich.configKeys.live,
      historyKey: rich.configKeys.history,
      settingsKey: rich.configKeys.settings,
      fields: [
        { id: "liveRefreshSeconds", label: "Live Refresh", type: "number" },
        { id: "requireMfa", label: "Require MFA", type: "boolean" },
      ],
    },
    apiSchema: {
      snapshot: rich.api.snapshot,
      action: rich.api.action,
      v1Snapshot: rich.api.v1Snapshot,
      v1Action: rich.api.v1Action,
      health: `${rich.api.snapshot}/health`,
    },
    healthEndpoint: `${rich.api.snapshot}/health`,
    auditProvider: provider(`${rich.id}-audit`, "Enterprise Audit", "/api/super-admin/audit/timeline"),
    analyticsProvider: provider(`${rich.id}-analytics`, "Analytics Provider"),
    searchProvider: provider(`${rich.id}-search`, "Enterprise Search", "/api/super-admin/search"),
    monitoringProvider: provider(`${rich.id}-monitoring`, "Operations Monitoring", "/api/super-admin/operations/health"),
    recoveryProvider: provider(`${rich.id}-recovery`, "Recovery Provider", "/api/super-admin/recovery"),
    certificationProvider: provider(`${rich.id}-certification`, "Certification Provider", "/api/super-admin/certification"),
    lifecycleProvider: provider(`${rich.id}-lifecycle`, "Config Lifecycle"),
    visibility: "internal",
    priority: 50,
    status: "active",
    tags: [category, rich.id],
    buildVersion: rich.version,
    compatibilityVersion: "2.0.0",
    baseHref: rich.baseHref,
    autoRegister: rich.autoRegister,
    lifecycle,
    health: "healthy",
    registeredAt: now(),
    updatedAt: now(),
  });
}

function synthesizeFromCoreEntry(
  entry: (typeof ENTERPRISE_CORE_REGISTRY)[number],
  lifecycle: ModuleLifecycleState = "ready",
): EnterpriseModuleV2Descriptor {
  const category = resolveModuleCategory(entry.id, entry.category === "commerce" ? "marketplace" : "system");
  const apiPath = entry.href === "/super-admin" ? "/super-admin/mission-control-engine" : entry.href;
  const snapshot = `/api${apiPath}`;
  return finalizeDescriptor({
    moduleId: entry.id,
    moduleName: entry.label,
    category,
    version: entry.version,
    description: entry.description,
    owner: "ROVEXO Enterprise",
    icon: entry.icon,
    dependencies: MODULE_DEPENDENCY_HINTS[entry.id] ?? [],
    routes: [{ id: "home", label: entry.label, href: entry.href }],
    navigation: [{ id: entry.id, label: entry.label, href: entry.href, icon: entry.icon }],
    permissions: [{ action: "view", label: "View module", roles: ["super-admin"] }],
    featureFlags: [{ id: "enabled", label: "Module Enabled", description: `${entry.label} master switch`, defaultEnabled: true }],
    settingsSchema: {
      draftKey: `${entry.id.replace(/-/g, "_")}_draft_v1`,
      liveKey: `${entry.id.replace(/-/g, "_")}_live_v1`,
      historyKey: `${entry.id.replace(/-/g, "_")}_history_v1`,
      settingsKey: `${entry.id.replace(/-/g, "_")}_settings_v1`,
      fields: [],
    },
    apiSchema: {
      snapshot,
      action: `${snapshot}/action`,
      v1Snapshot: versionedApiPath(apiPath),
      v1Action: `${versionedApiPath(apiPath)}/action`,
      health: `${snapshot}/health`,
    },
    healthEndpoint: `${snapshot}/health`,
    auditProvider: provider(`${entry.id}-audit`, "Enterprise Audit"),
    analyticsProvider: provider(`${entry.id}-analytics`, "Analytics"),
    searchProvider: provider(`${entry.id}-search`, "Enterprise Search"),
    monitoringProvider: provider(`${entry.id}-monitoring`, "Monitoring"),
    recoveryProvider: provider(`${entry.id}-recovery`, "Recovery"),
    certificationProvider: provider(`${entry.id}-certification`, "Certification"),
    lifecycleProvider: provider(`${entry.id}-lifecycle`, "Lifecycle"),
    visibility: entry.autoRegister ? "internal" : "restricted",
    priority: entry.category === "core" ? 100 : 50,
    status: entry.health === "healthy" ? "active" : "beta",
    tags: [category, entry.id],
    buildVersion: entry.version,
    compatibilityVersion: "2.0.0",
    baseHref: entry.href,
    autoRegister: entry.autoRegister,
    lifecycle,
    health: healthFromCore(entry.health),
    registeredAt: now(),
    updatedAt: now(),
  });
}

/** Discover all enterprise modules from registry sources — no hardcoded module list. */
export function discoverEnterpriseModulesV2(): EnterpriseModuleV2Descriptor[] {
  const richDescriptors = listEnterpriseModuleDescriptors();
  const richById = new Map(richDescriptors.map((d) => [d.id, d]));
  const discovered = new Map<string, EnterpriseModuleV2Descriptor>();

  for (const entry of ENTERPRISE_CORE_REGISTRY) {
    const rich = richById.get(entry.id);
    discovered.set(entry.id, rich ? synthesizeFromRichDescriptor(rich) : synthesizeFromCoreEntry(entry));
  }

  for (const rich of richDescriptors) {
    if (!discovered.has(rich.id)) {
      discovered.set(rich.id, synthesizeFromRichDescriptor(rich));
    }
  }

  if (!discovered.has("enterprise-module-registry-v2")) {
    discovered.set(
      "enterprise-module-registry-v2",
      synthesizeFromCoreEntry({
        id: "enterprise-module-registry-v2",
        label: "Enterprise Module Registry V2",
        icon: "🗂️",
        description: "Central registry for discovering, validating, and orchestrating enterprise modules",
        href: "/super-admin/module-registry",
        category: "core",
        version: "2.0",
        health: "healthy",
        autoRegister: true,
      }),
    );
  }

  return [...discovered.values()].sort((a, b) => b.priority - a.priority || a.moduleName.localeCompare(b.moduleName));
}

export function getDiscoveredModuleV2(moduleId: string): EnterpriseModuleV2Descriptor | undefined {
  return discoverEnterpriseModulesV2().find((module) => module.moduleId === moduleId);
}
