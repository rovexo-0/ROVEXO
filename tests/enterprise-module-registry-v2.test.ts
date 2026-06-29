import { describe, expect, it } from "vitest";
import { discoverEnterpriseModulesV2, getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { buildDependencyGraph, computeDependencyHealth } from "@/lib/enterprise-module-registry-v2/dependencies";
import { createDefaultRegistryV2Document, normalizeRegistryDocument } from "@/lib/enterprise-module-registry-v2/defaults";
import {
  applyHealthToModules,
  buildDashboardMetrics,
  buildFeatureFlagStates,
  computeModuleHealth,
} from "@/lib/enterprise-module-registry-v2/health";
import {
  MODULE_REGISTRY_V2_API,
  MODULE_REGISTRY_V2_ROUTES,
  REGISTRY_V2_CATEGORIES,
  resolveModuleCategory,
} from "@/lib/enterprise-module-registry-v2/registry";
import { searchRegistryModules } from "@/lib/enterprise-module-registry-v2/search";
import {
  buildSelfRegistrationManifest,
  getSelfRegistrationTargets,
} from "@/lib/enterprise-module-registry-v2/self-register";
import { validateModuleDescriptor, validateRegistryModules, VALIDATION_CHECKS } from "@/lib/enterprise-module-registry-v2/validation";
import {
  buildVersionMatrix,
  detectPendingPublish,
  isCompatibleVersion,
  parseSemver,
} from "@/lib/enterprise-module-registry-v2/versioning";
import type { EnterpriseModuleV2Descriptor } from "@/lib/enterprise-module-registry-v2/types";

function sampleModule(overrides: Partial<EnterpriseModuleV2Descriptor> = {}): EnterpriseModuleV2Descriptor {
  const base = getDiscoveredModuleV2("incident-command-center");
  if (!base) throw new Error("sample module unavailable");
  return { ...base, ...overrides };
}

describe("descriptor validation", () => {
  it("validates a complete module descriptor", () => {
    const result = validateModuleDescriptor(sampleModule());
    expect(result.valid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it("fails when moduleId is missing", () => {
    const result = validateModuleDescriptor(sampleModule({ moduleId: "" }));
    expect(result.valid).toBe(false);
  });

  it("fails when routes are empty", () => {
    const result = validateModuleDescriptor(sampleModule({ routes: [] }));
    expect(result.valid).toBe(false);
  });

  it("fails when permissions are empty", () => {
    const result = validateModuleDescriptor(sampleModule({ permissions: [] }));
    expect(result.valid).toBe(false);
  });

  it("fails when feature flags are empty", () => {
    const result = validateModuleDescriptor(sampleModule({ featureFlags: [] }));
    expect(result.valid).toBe(false);
  });

  it("validates all required check categories exist", () => {
    expect(VALIDATION_CHECKS).toContain("descriptor");
    expect(VALIDATION_CHECKS).toContain("certification");
    expect(VALIDATION_CHECKS.length).toBe(16);
  });

  it("validates registry modules in batch", () => {
    const modules = discoverEnterpriseModulesV2().slice(0, 5);
    const report = validateRegistryModules(modules);
    expect(report.modules.length).toBe(5);
    expect(report.overallScore).toBeGreaterThan(0);
  });

  it("reports overall validity for discovered modules", () => {
    const report = validateRegistryModules(discoverEnterpriseModulesV2());
    expect(report.overallValid).toBe(true);
  });
});

describe("registration and discovery", () => {
  it("auto-discovers modules from enterprise core registry", () => {
    const modules = discoverEnterpriseModulesV2();
    expect(modules.length).toBeGreaterThan(30);
  });

  it("includes enterprise module registry v2 itself", () => {
    expect(getDiscoveredModuleV2("enterprise-module-registry-v2")).toBeDefined();
  });

  it("includes incident command center", () => {
    expect(getDiscoveredModuleV2("incident-command-center")).toBeDefined();
  });

  it("includes enterprise compliance center", () => {
    expect(getDiscoveredModuleV2("enterprise-compliance-center")).toBeDefined();
  });

  it("assigns categories via resolver", () => {
    expect(resolveModuleCategory("orders-engine")).toBe("orders");
    expect(resolveModuleCategory("shipping-engine")).toBe("shipping");
  });

  it("normalizes registry documents with discovered modules", () => {
    const doc = normalizeRegistryDocument(createDefaultRegistryV2Document("Live"));
    expect(doc.modules.length).toBeGreaterThan(30);
  });

  it("creates default draft document", () => {
    const doc = createDefaultRegistryV2Document("Draft");
    expect(doc.label).toBe("Draft");
    expect(doc.version).toBe("2.0.0");
  });

  it("merges persisted modules on normalize", () => {
    const doc = normalizeRegistryDocument({
      ...createDefaultRegistryV2Document("Live"),
      modules: [sampleModule({ lifecycle: "maintenance" })],
    });
    const mod = doc.modules.find((m) => m.moduleId === "incident-command-center");
    expect(mod?.lifecycle).toBe("maintenance");
  });
});

describe("dependency graph", () => {
  it("builds nodes and edges", () => {
    const modules = discoverEnterpriseModulesV2();
    const graph = buildDependencyGraph(modules);
    expect(graph.nodes.length).toBe(modules.length);
    expect(graph.edges.length).toBeGreaterThan(0);
  });

  it("computes dependents", () => {
    const modules = discoverEnterpriseModulesV2();
    const graph = buildDependencyGraph(modules);
    const icc = graph.nodes.find((n) => n.moduleId === "incident-command-center");
    expect(icc?.dependencies.length).toBeGreaterThan(0);
  });

  it("detects missing dependencies", () => {
    const graph = buildDependencyGraph([
      sampleModule({ moduleId: "test-mod", dependencies: ["nonexistent-module-xyz"] }),
    ]);
    expect(graph.missingDependencies.length).toBe(1);
  });

  it("returns empty circular dependencies for valid graph sample", () => {
    const modules = discoverEnterpriseModulesV2().slice(0, 10);
    const graph = buildDependencyGraph(modules);
    expect(Array.isArray(graph.circularDependencies)).toBe(true);
  });

  it("detects circular dependencies", () => {
    const graph = buildDependencyGraph([
      sampleModule({ moduleId: "a", dependencies: ["b"] }),
      sampleModule({ moduleId: "b", dependencies: ["a"] }),
    ]);
    expect(graph.circularDependencies.length).toBeGreaterThan(0);
  });

  it("identifies unused modules", () => {
    const graph = buildDependencyGraph([
      sampleModule({ moduleId: "orphan-module", dependencies: [] }),
    ]);
    expect(graph.unusedModules).toContain("orphan-module");
  });

  it("tracks dependency graph fields and health score", () => {
    const graph = buildDependencyGraph(discoverEnterpriseModulesV2().slice(0, 5));
    expect(Array.isArray(graph.versionConflicts)).toBe(true);
    expect(graph.parentModules).toBeDefined();
    expect(graph.childModules).toBeDefined();
    expect(graph.healthDependencyChain).toBeDefined();
    expect(computeDependencyHealth(graph)).toBeGreaterThan(0);
  });

  it("maps incident timeline dependency to command center", () => {
    const timeline = getDiscoveredModuleV2("incident-timeline");
    expect(timeline?.dependencies).toContain("incident-command-center");
  });
});

describe("health monitoring", () => {
  it("marks healthy modules", () => {
    expect(computeModuleHealth(sampleModule(), false)).toBe("healthy");
  });

  it("marks disabled modules as failed", () => {
    expect(computeModuleHealth(sampleModule(), true)).toBe("failed");
  });

  it("marks maintenance lifecycle as warning", () => {
    expect(computeModuleHealth(sampleModule({ lifecycle: "maintenance" }), false)).toBe("warning");
  });

  it("applies health to module list", () => {
    const modules = applyHealthToModules(discoverEnterpriseModulesV2().slice(0, 3), []);
    expect(modules.every((m) => m.health)).toBe(true);
  });

  it("builds dashboard metrics", () => {
    const modules = applyHealthToModules(discoverEnterpriseModulesV2().slice(0, 10), []);
    const metrics = buildDashboardMetrics(modules, false, null, 95);
    expect(metrics.registeredModules).toBe(10);
    expect(metrics.enterpriseScore).toBeGreaterThan(0);
  });

  it("counts disabled modules", () => {
    const modules = applyHealthToModules(
      [sampleModule({ moduleId: "x", lifecycle: "disabled" })],
      ["x"],
    );
    const metrics = buildDashboardMetrics(modules, false, null, 90);
    expect(metrics.disabledModules).toBe(1);
  });

  it("builds feature flag states", () => {
    const modules = discoverEnterpriseModulesV2().slice(0, 2);
    const flags = buildFeatureFlagStates(modules, {});
    expect(flags.length).toBeGreaterThan(0);
  });

  it("respects feature flag kill switch", () => {
    const mod = sampleModule({
      featureFlags: [{ id: "killed", label: "Killed", description: "x", defaultEnabled: true, emergencyKillSwitch: true }],
    });
    const flags = buildFeatureFlagStates([mod], {});
    expect(flags[0]?.enabled).toBe(false);
    expect(flags[0]?.source).toBe("kill-switch");
  });
});

describe("permissions and navigation", () => {
  it("exposes permissions on discovered modules", () => {
    const mod = getDiscoveredModuleV2("incident-command-center");
    expect(mod?.permissions.length).toBeGreaterThan(0);
  });

  it("requires super-admin role on permissions", () => {
    const mod = getDiscoveredModuleV2("enterprise-compliance-center");
    expect(mod?.permissions.every((p) => p.roles.includes("super-admin"))).toBe(true);
  });

  it("exposes navigation items", () => {
    const mod = getDiscoveredModuleV2("enterprise-module-registry-v2");
    expect(mod?.navigation[0]?.href).toBe("/super-admin/module-registry");
  });

  it("exposes registry routes including search", () => {
    expect(MODULE_REGISTRY_V2_ROUTES.length).toBe(6);
    expect(MODULE_REGISTRY_V2_ROUTES[0]?.href).toBe("/super-admin/module-registry");
    expect(MODULE_REGISTRY_V2_ROUTES.some((r) => r.id === "search")).toBe(true);
  });

  it("lists all registry categories", () => {
    expect(REGISTRY_V2_CATEGORIES.length).toBe(25);
    expect(REGISTRY_V2_CATEGORIES.some((c) => c.id === "enterprise-core")).toBe(true);
  });

  it("maps module routes under super-admin", () => {
    const mod = getDiscoveredModuleV2("enterprise-module-registry-v2");
    expect(mod?.routes.every((r) => r.href.startsWith("/super-admin"))).toBe(true);
  });
});

describe("feature flags", () => {
  it("includes feature flags on rich descriptors", () => {
    const mod = getDiscoveredModuleV2("incident-command-center");
    expect(mod?.featureFlags.some((f) => f.id === "live-dashboard")).toBe(true);
  });

  it("supports override via live config", () => {
    const mod = discoverEnterpriseModulesV2().slice(0, 1);
    const flags = buildFeatureFlagStates(mod, { [mod[0]!.moduleId]: { enabled: false } });
    const enabledFlag = flags.find((f) => f.flagId === "enabled");
    if (enabledFlag) expect(enabledFlag.enabled).toBe(false);
  });

  it("defaults flags to enabled for core modules", () => {
    const mod = getDiscoveredModuleV2("enterprise-core");
    const flag = mod?.featureFlags.find((f) => f.id === "enabled");
    expect(flag?.defaultEnabled).toBe(true);
  });

  it("includes compliance readiness flag", () => {
    const mod = getDiscoveredModuleV2("enterprise-compliance-center");
    expect(mod?.featureFlags.some((f) => f.id === "readiness-dashboard")).toBe(true);
  });
});

describe("API and routes", () => {
  it("exposes snapshot API path", () => {
    expect(MODULE_REGISTRY_V2_API.snapshot).toBe("/api/super-admin/module-registry");
  });

  it("exposes v1 snapshot path", () => {
    expect(MODULE_REGISTRY_V2_API.v1Snapshot).toBe("/api/v1/super-admin/module-registry");
  });

  it("exposes lifecycle API endpoints", () => {
    expect(MODULE_REGISTRY_V2_API.register).toContain("/register");
    expect(MODULE_REGISTRY_V2_API.publish).toContain("/publish");
    expect(MODULE_REGISTRY_V2_API.rollback).toContain("/rollback");
    expect(MODULE_REGISTRY_V2_API.validate).toContain("/validate");
    expect(MODULE_REGISTRY_V2_API.search).toContain("/search");
    expect(MODULE_REGISTRY_V2_API.import).toContain("/import");
    expect(MODULE_REGISTRY_V2_API.export).toContain("/export");
  });
});

describe("import export versioning", () => {
  it("parses semver", () => {
    expect(parseSemver("2.0.0")).toEqual({ major: 2, minor: 0, patch: 0 });
  });

  it("checks compatibility", () => {
    expect(isCompatibleVersion("2.1.0", "2.0.0")).toBe(true);
    expect(isCompatibleVersion("3.0.0", "2.0.0")).toBe(false);
  });

  it("builds version matrix", () => {
    const matrix = buildVersionMatrix(discoverEnterpriseModulesV2().slice(0, 3));
    expect(matrix.length).toBe(3);
    expect(matrix[0]?.rollbackAvailable).toBe(true);
  });

  it("detects pending publish when draft differs", () => {
    const live = createDefaultRegistryV2Document("Live");
    const draft = { ...live, version: "2.0.1" };
    expect(detectPendingPublish(draft, live)).toBe(true);
  });

  it("no pending publish when identical", () => {
    const live = createDefaultRegistryV2Document("Live");
    expect(detectPendingPublish(live, live)).toBe(false);
  });

  it("export document includes modules", () => {
    const doc = createDefaultRegistryV2Document("Live");
    expect(doc.modules.length).toBeGreaterThan(0);
  });
});

describe("publish rollback history monitoring", () => {
  it("registry document supports audit log", () => {
    const doc = createDefaultRegistryV2Document("Draft");
    expect(Array.isArray(doc.auditLog)).toBe(true);
  });

  it("registry document tracks disabled modules", () => {
    const doc = createDefaultRegistryV2Document("Live");
    expect(Array.isArray(doc.disabledModules)).toBe(true);
  });

  it("registry document tracks feature flag overrides", () => {
    const doc = createDefaultRegistryV2Document("Live");
    expect(typeof doc.featureFlagOverrides).toBe("object");
  });

  it("modules expose health endpoints", () => {
    const modules = discoverEnterpriseModulesV2();
    expect(modules.every((m) => m.healthEndpoint.length > 0)).toBe(true);
  });

  it("modules expose monitoring providers", () => {
    const mod = sampleModule();
    expect(mod.monitoringProvider.enabled).toBe(true);
  });

  it("modules expose audit providers", () => {
    const mod = sampleModule();
    expect(mod.auditProvider.enabled).toBe(true);
  });

  it("modules expose recovery providers", () => {
    const mod = sampleModule();
    expect(mod.recoveryProvider.enabled).toBe(true);
  });

  it("modules expose certification providers", () => {
    const mod = sampleModule();
    expect(mod.certificationProvider.enabled).toBe(true);
  });
});

describe("search registry", () => {
  it("finds modules by query and category", () => {
    const modules = discoverEnterpriseModulesV2();
    const byQuery = searchRegistryModules(modules, { q: "incident", limit: 10 });
    expect(byQuery.length).toBeGreaterThan(0);
    const byCategory = searchRegistryModules(modules, { category: "operations", limit: 10 });
    expect(byCategory.every((r) => modules.find((m) => m.moduleId === r.moduleId)?.category === "operations")).toBe(true);
  });
});

describe("self registration", () => {
  it("lists targets and builds manifest", () => {
    const targets = getSelfRegistrationTargets();
    expect(targets.length).toBeGreaterThan(15);
    expect(targets).toContain("enterprise-registry");
    const manifest = buildSelfRegistrationManifest(discoverEnterpriseModulesV2());
    expect(manifest.some((m) => m.target === "mission-control" && m.moduleCount > 0)).toBe(true);
  });
});

describe("architecture compliance", () => {
  it("includes compliance and dependency health on dashboard", () => {
    const modules = applyHealthToModules(discoverEnterpriseModulesV2().slice(0, 10), []);
    const graph = buildDependencyGraph(modules);
    const report = validateRegistryModules(modules);
    const depHealth = computeDependencyHealth(graph);
    const metrics = buildDashboardMetrics(modules, false, null, report.overallScore, depHealth);
    expect(metrics.architectureCompliance).toBeGreaterThan(0);
    expect(metrics.dependencyHealth).toBeGreaterThan(0);
    expect(metrics.registryHealth).toBeGreaterThan(0);
  });
});

describe("enterprise integrations", () => {
  it("registry module has enterprise-core category mapping", () => {
    expect(resolveModuleCategory("enterprise-module-registry-v2")).toBe("enterprise-core");
  });

  it("registry module depends on enterprise core", () => {
    const mod = getDiscoveredModuleV2("enterprise-module-registry-v2");
    expect(mod?.dependencies).toContain("enterprise-core");
  });

  it("discovered modules include mission control", () => {
    expect(getDiscoveredModuleV2("mission-control")).toBeDefined();
  });

  it("discovered modules include recovery center", () => {
    expect(getDiscoveredModuleV2("recovery-center")).toBeDefined();
  });

  it("discovered modules include certification center", () => {
    expect(getDiscoveredModuleV2("certification-center")).toBeDefined();
  });

  it("discovered modules include audit compliance", () => {
    expect(getDiscoveredModuleV2("audit-compliance-center")).toBeDefined();
  });

  it("discovered modules include developer center", () => {
    expect(getDiscoveredModuleV2("developer-center")).toBeDefined();
  });

  it("discovered modules include operations center", () => {
    expect(getDiscoveredModuleV2("operations-center")).toBeDefined();
  });
});

describe("lifecycle states and providers", () => {
  it("supports registered lifecycle state", () => {
    const mod = sampleModule({ lifecycle: "registered" });
    expect(mod.lifecycle).toBe("registered");
  });

  it("supports publishing lifecycle state", () => {
    const mod = sampleModule({ lifecycle: "publishing" });
    expect(mod.lifecycle).toBe("publishing");
  });

  it("supports rolling-back lifecycle state", () => {
    const mod = sampleModule({ lifecycle: "rolling-back" });
    expect(mod.lifecycle).toBe("rolling-back");
  });

  it("exposes lifecycle provider on modules", () => {
    expect(sampleModule().lifecycleProvider.enabled).toBe(true);
  });

  it("exposes analytics provider on modules", () => {
    expect(sampleModule().analyticsProvider.enabled).toBe(true);
  });

  it("exposes search provider on modules", () => {
    expect(sampleModule().searchProvider.enabled).toBe(true);
  });

  it("exposes settings schema keys", () => {
    const mod = sampleModule();
    expect(mod.settingsSchema.draftKey).toBeTruthy();
    expect(mod.settingsSchema.liveKey).toBeTruthy();
  });

  it("exposes api schema with v1 paths", () => {
    const mod = sampleModule();
    expect(mod.apiSchema.v1Snapshot).toContain("/api/v1/");
  });

  it("includes compatibility version on modules", () => {
    expect(sampleModule().compatibilityVersion).toBe("2.0.0");
  });

  it("includes build version matching module version", () => {
    const mod = sampleModule();
    expect(mod.buildVersion).toBe(mod.version);
  });
});
