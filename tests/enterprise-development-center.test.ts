import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformDevelopmentAction, createDevelopmentAuditEntry, requiresMfaForDevelopment } from "@/lib/enterprise-development-center/audit";
import { isDevelopmentConfigAction } from "@/lib/enterprise-development-center/config-actions";
import { ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-development-center/descriptor";
import {
  advanceReleasePipeline,
  allValidationsPass,
  createDefaultDevelopmentSettings,
  createDefaultDevelopmentState,
  queueBuild,
  runEnterpriseValidation,
} from "@/lib/enterprise-development-center/engine";
import { exportDevelopmentSnapshot, isValidDevelopmentExportFormat } from "@/lib/enterprise-development-center/export";
import { computeDevelopmentHealth } from "@/lib/enterprise-development-center/health";
import { validateDevelopmentReadiness } from "@/lib/enterprise-development-center/reader";
import {
  AI_ENGINE_IDS,
  BUILD_STATUSES,
  CODE_QUALITY_CHECKS,
  DEBT_CATEGORIES,
  ENTERPRISE_DEVELOPMENT_API,
  ENTERPRISE_DEVELOPMENT_ROUTES,
  EXPORT_FORMATS,
  PROJECT_TREE_NODES,
  RELEASE_PIPELINE_STAGES,
  VALIDATION_CHECKS,
} from "@/lib/enterprise-development-center/registry";
import type { DevelopmentSnapshot } from "@/lib/enterprise-development-center/types";

function sampleSnapshot(): DevelopmentSnapshot {
  const state = createDefaultDevelopmentState();
  const settings = createDefaultDevelopmentSettings();
  return {
    tab: "dashboard",
    ...state,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      enterprise_development_center_v1: true,
      architecture_studio_enabled: true,
      devsecops_enabled: true,
      release_pipeline_enabled: true,
      ai_integration_panel_enabled: true,
      code_quality_enabled: true,
      governance_integration_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: state.dashboard.enterpriseScore, message: "ok" },
  };
}

describe("enterprise development descriptor", () => {
  it("registers module id", () => {
    expect(ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.id).toBe("enterprise-development-center");
  });

  it("auto registers", () => {
    expect(ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/development");
  });

  it("has master feature flag", () => {
    expect(ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("enterprise_development_center_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-development-center")?.id).toBe("enterprise-development-center");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-development-center")?.moduleId).toBe("enterprise-development-center");
  });

  it("lists development routes", () => {
    expect(ENTERPRISE_DEVELOPMENT_ROUTES.length).toBe(20);
  });

  it("relates to governance and omega", () => {
    expect(ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-governance-center");
    expect(ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.relatedModules).toContain("omega-command-center");
  });

  it("uses platform category", () => {
    expect(ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.category).toBe("platform");
  });
});

describe("dashboard and project tree", () => {
  it("creates dashboard metrics", () => {
    const dashboard = createDefaultDevelopmentState().dashboard;
    expect(dashboard.projects).toBeGreaterThan(0);
    expect(dashboard.enterpriseScore).toBeGreaterThan(95);
  });

  it("defines project tree nodes", () => {
    expect(PROJECT_TREE_NODES).toContain("modules");
    expect(PROJECT_TREE_NODES).toContain("enterprise-engines");
  });

  it("creates project tree", () => {
    expect(createDefaultDevelopmentState().projectTree).toHaveLength(PROJECT_TREE_NODES.length);
  });

  it("creates module explorer entries", () => {
    expect(createDefaultDevelopmentState().modules.length).toBeGreaterThan(0);
  });
});

describe("architecture and dependencies", () => {
  it("creates architecture nodes", () => {
    expect(createDefaultDevelopmentState().architectureNodes.some((n) => n.type === "governance")).toBe(true);
  });

  it("creates dependency links", () => {
    expect(createDefaultDevelopmentState().dependencyLinks.length).toBeGreaterThan(0);
  });

  it("tracks api endpoints", () => {
    expect(createDefaultDevelopmentState().apiEndpoints.some((a) => a.path.includes("development"))).toBe(true);
  });
});

describe("builds and release pipeline", () => {
  it("defines build statuses", () => {
    expect(BUILD_STATUSES).toContain("running");
    expect(BUILD_STATUSES).toContain("passed");
  });

  it("queues build", () => {
    const build = queueBuild("rovexo-web");
    expect(build.status).toBe("queued");
    expect(build.project).toBe("rovexo-web");
  });

  it("defines release pipeline stages", () => {
    expect(RELEASE_PIPELINE_STAGES[0]).toBe("development");
    expect(RELEASE_PIPELINE_STAGES.at(-1)).toBe("production-approval");
    expect(RELEASE_PIPELINE_STAGES).toHaveLength(10);
  });

  it("advances release pipeline", () => {
    const release = createDefaultDevelopmentState().releases[0]!;
    const advanced = advanceReleasePipeline(release);
    expect(advanced.stagesCompleted.length).toBeGreaterThan(release.stagesCompleted.length);
  });
});

describe("ai integration", () => {
  it("defines ai engine ids", () => {
    expect(AI_ENGINE_IDS).toContain("omega-prime");
    expect(AI_ENGINE_IDS).toContain("scan");
    expect(AI_ENGINE_IDS).toContain("guardian");
  });

  it("creates ai engine status", () => {
    expect(createDefaultDevelopmentState().aiEngines).toHaveLength(AI_ENGINE_IDS.length);
  });
});

describe("technical debt and code quality", () => {
  it("creates debt categories", () => {
    expect(createDefaultDevelopmentState().technicalDebt).toHaveLength(DEBT_CATEGORIES.length);
  });

  it("defines code quality checks", () => {
    expect(CODE_QUALITY_CHECKS).toContain("dead-code");
    expect(CODE_QUALITY_CHECKS).toContain("legacy-references");
  });

  it("creates code quality issues", () => {
    expect(createDefaultDevelopmentState().codeQuality.length).toBeGreaterThan(0);
  });
});

describe("validation", () => {
  it("defines validation checks", () => {
    expect(VALIDATION_CHECKS).toContain("architecture");
    expect(VALIDATION_CHECKS).toContain("zero-legacy");
  });

  it("runs enterprise validation", () => {
    expect(runEnterpriseValidation().every((r) => r.status === "pass")).toBe(true);
  });

  it("all validations pass", () => {
    expect(allValidationsPass(runEnterpriseValidation())).toBe(true);
  });
});

describe("export", () => {
  it("exports json", () => {
    expect(exportDevelopmentSnapshot(sampleSnapshot(), "json")).toContain("snapshot");
  });

  it("exports csv", () => {
    expect(exportDevelopmentSnapshot(sampleSnapshot(), "csv")).toContain("id,label");
  });

  it("exports pdf report", () => {
    expect(exportDevelopmentSnapshot(sampleSnapshot(), "pdf")).toContain("Enterprise Development Report");
  });

  it("validates export format", () => {
    expect(isValidDevelopmentExportFormat("excel")).toBe(true);
    expect(EXPORT_FORMATS).toHaveLength(4);
  });
});

describe("audit and permissions", () => {
  it("allows view", () => {
    expect(canPerformDevelopmentAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires mfa for deploy", () => {
    expect(canPerformDevelopmentAction({ action: "deploy", mfaVerified: false }).allowed).toBe(false);
    expect(canPerformDevelopmentAction({ action: "deploy", mfaVerified: true }).allowed).toBe(true);
  });

  it("requires mfa for deploy action type", () => {
    expect(requiresMfaForDevelopment("deploy")).toBe(true);
  });

  it("creates audit entry", () => {
    expect(createDevelopmentAuditEntry("validate", "admin", "development").action).toBe("validate");
  });

  it("identifies config actions", () => {
    expect(isDevelopmentConfigAction("publish-config")).toBe(true);
  });
});

describe("health and readiness", () => {
  it("computes development health", () => {
    expect(computeDevelopmentHealth(sampleSnapshot()).score).toBeGreaterThan(0);
  });

  it("reports disabled", () => {
    expect(
      computeDevelopmentHealth({
        ...sampleSnapshot(),
        featureFlagsConfig: { enterprise_development_center_v1: false },
      }).status,
    ).toBe("failed");
  });

  it("validates readiness", () => {
    expect(validateDevelopmentReadiness(sampleSnapshot()).ready).toBe(true);
  });
});

describe("api routes", () => {
  it("exposes snapshot api", () => {
    expect(ENTERPRISE_DEVELOPMENT_API.snapshot).toBe("/api/super-admin/development");
  });

  it("exposes development endpoints", () => {
    expect(ENTERPRISE_DEVELOPMENT_API.dashboard).toContain("dashboard");
    expect(ENTERPRISE_DEVELOPMENT_API.modules).toContain("modules");
    expect(ENTERPRISE_DEVELOPMENT_API.architecture).toContain("architecture");
    expect(ENTERPRISE_DEVELOPMENT_API.dependencies).toContain("dependencies");
    expect(ENTERPRISE_DEVELOPMENT_API.builds).toContain("builds");
    expect(ENTERPRISE_DEVELOPMENT_API.validate).toContain("validate");
    expect(ENTERPRISE_DEVELOPMENT_API.export).toContain("export");
  });

  it("exposes v1 snapshot", () => {
    expect(ENTERPRISE_DEVELOPMENT_API.v1Snapshot).toContain("/api/v1/");
  });
});

describe("database and storage", () => {
  it("creates database tables", () => {
    expect(createDefaultDevelopmentState().databaseTables.length).toBeGreaterThan(0);
  });

  it("creates storage buckets", () => {
    expect(createDefaultDevelopmentState().storageBuckets.some((b) => b.integrity >= 99)).toBe(true);
  });
});

describe("settings", () => {
  it("creates default settings", () => {
    const settings = createDefaultDevelopmentSettings();
    expect(settings.mfaRequiredForDeploy).toBe(true);
    expect(settings.governanceIntegrationEnabled).toBe(true);
  });
});
