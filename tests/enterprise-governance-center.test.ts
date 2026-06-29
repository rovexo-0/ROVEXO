import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformGovernanceAction, createGovernanceAuditEntry, requiresMfaForGovernance } from "@/lib/enterprise-governance-center/audit";
import { isGovernanceConfigAction } from "@/lib/enterprise-governance-center/config-actions";
import { ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-governance-center/descriptor";
import {
  allCertificationChecksPass,
  computeOverallScore,
  createDefaultGovernanceSettings,
  createDefaultGovernanceState,
  issueCertificate,
  runArchitectureScan,
  runFullValidation,
} from "@/lib/enterprise-governance-center/engine";
import { exportGovernanceSnapshot, isValidGovernanceExportFormat } from "@/lib/enterprise-governance-center/export";
import { computeGovernanceHealth } from "@/lib/enterprise-governance-center/health";
import { validateGovernanceReadiness } from "@/lib/enterprise-governance-center/reader";
import {
  ARCHITECTURE_CHECKS,
  CERTIFICATION_CHECKS,
  COMPLIANCE_CATEGORIES,
  CONSTITUTION_SECTIONS,
  DEBT_CATEGORIES,
  ENTERPRISE_GOVERNANCE_API,
  ENTERPRISE_GOVERNANCE_ROUTES,
  ENTERPRISE_SCORE_DOMAINS,
  EXPORT_FORMATS,
  VALIDATION_PIPELINE,
} from "@/lib/enterprise-governance-center/registry";
import type { GovernanceSnapshot } from "@/lib/enterprise-governance-center/types";

function sampleSnapshot(): GovernanceSnapshot {
  const state = createDefaultGovernanceState();
  const settings = createDefaultGovernanceSettings();
  const overallScore = computeOverallScore(state.enterpriseScores);
  return {
    tab: "constitution",
    ...state,
    overallScore,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      enterprise_governance_center_v1: true,
      constitution_viewer_enabled: true,
      architecture_governance_enabled: true,
      rule_engine_enabled: true,
      certification_engine_enabled: true,
      validation_pipeline_enabled: true,
      technical_debt_tracking_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: overallScore, message: "ok" },
  };
}

describe("enterprise governance descriptor", () => {
  it("registers module id", () => {
    expect(ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.id).toBe("enterprise-governance-center");
  });

  it("auto registers", () => {
    expect(ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/governance");
  });

  it("has master feature flag", () => {
    expect(ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("enterprise_governance_center_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-governance-center")?.id).toBe("enterprise-governance-center");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-governance-center")?.moduleId).toBe("enterprise-governance-center");
  });

  it("lists governance routes", () => {
    expect(ENTERPRISE_GOVERNANCE_ROUTES.length).toBeGreaterThanOrEqual(10);
  });

  it("relates to registry and omega", () => {
    expect(ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-module-registry-v2");
    expect(ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.relatedModules).toContain("omega-command-center");
  });

  it("uses core category", () => {
    expect(ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.category).toBe("core");
  });
});

describe("constitution", () => {
  it("defines constitution sections", () => {
    expect(CONSTITUTION_SECTIONS).toContain("architecture");
    expect(CONSTITUTION_SECTIONS).toContain("ai");
    expect(CONSTITUTION_SECTIONS.length).toBe(22);
  });

  it("creates constitution articles", () => {
    expect(createDefaultGovernanceState().constitution.length).toBe(CONSTITUTION_SECTIONS.length);
  });

  it("tracks amendments", () => {
    expect(createDefaultGovernanceState().amendments.length).toBeGreaterThan(0);
  });
});

describe("architecture governance", () => {
  it("defines architecture checks", () => {
    expect(ARCHITECTURE_CHECKS).toContain("duplicate-routes");
    expect(ARCHITECTURE_CHECKS).toContain("registry-violations");
  });

  it("runs architecture scan", () => {
    expect(runArchitectureScan().length).toBeGreaterThan(0);
  });
});

describe("compliance and rules", () => {
  it("defines compliance categories", () => {
    expect(COMPLIANCE_CATEGORIES.length).toBe(11);
  });

  it("creates module compliance", () => {
    const compliance = createDefaultGovernanceState().moduleCompliance;
    expect(compliance.some((m) => m.status === "pass")).toBe(true);
  });

  it("creates enterprise rules", () => {
    const rules = createDefaultGovernanceState().rules;
    expect(rules.some((r) => r.name.includes("OMEGA"))).toBe(true);
    expect(rules.some((r) => r.name.includes("hardcoded"))).toBe(true);
  });
});

describe("technical debt and scores", () => {
  it("creates debt categories", () => {
    expect(createDefaultGovernanceState().technicalDebt).toHaveLength(DEBT_CATEGORIES.length);
  });

  it("creates enterprise scores", () => {
    expect(createDefaultGovernanceState().enterpriseScores).toHaveLength(ENTERPRISE_SCORE_DOMAINS.length);
  });

  it("computes overall score", () => {
    const scores = createDefaultGovernanceState().enterpriseScores;
    expect(computeOverallScore(scores)).toBeGreaterThan(99);
  });
});

describe("certification and validation", () => {
  it("defines certification checks", () => {
    expect(CERTIFICATION_CHECKS).toContain("marketplace");
    expect(CERTIFICATION_CHECKS).toContain("compliance");
  });

  it("all certification checks pass", () => {
    expect(allCertificationChecksPass()).toBe(true);
  });

  it("issues certificate", () => {
    const cert = issueCertificate("super-admin");
    expect(cert.immutable).toBe(true);
    expect(cert.checksPassed).toBe(CERTIFICATION_CHECKS.length);
  });

  it("runs validation pipeline", () => {
    const run = runFullValidation();
    expect(run.status).toBe("completed");
    expect(run.stagesCompleted).toHaveLength(VALIDATION_PIPELINE.length);
  });
});

describe("export", () => {
  it("exports json", () => {
    expect(exportGovernanceSnapshot(sampleSnapshot(), "json")).toContain("snapshot");
  });

  it("exports csv", () => {
    expect(exportGovernanceSnapshot(sampleSnapshot(), "csv")).toContain("domain,score");
  });

  it("validates export format", () => {
    expect(isValidGovernanceExportFormat("pdf")).toBe(true);
    expect(EXPORT_FORMATS).toHaveLength(4);
  });
});

describe("audit and permissions", () => {
  it("allows view", () => {
    expect(canPerformGovernanceAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires mfa for certify", () => {
    expect(canPerformGovernanceAction({ action: "certify", mfaVerified: false }).allowed).toBe(false);
    expect(canPerformGovernanceAction({ action: "certify", mfaVerified: true }).allowed).toBe(true);
  });

  it("requires mfa for certify action type", () => {
    expect(requiresMfaForGovernance("certify")).toBe(true);
  });

  it("creates audit entry", () => {
    expect(createGovernanceAuditEntry("validate", "admin", "governance").action).toBe("validate");
  });

  it("identifies config actions", () => {
    expect(isGovernanceConfigAction("publish-config")).toBe(true);
  });
});

describe("health and readiness", () => {
  it("computes governance health", () => {
    expect(computeGovernanceHealth(sampleSnapshot()).score).toBeGreaterThan(0);
  });

  it("reports disabled", () => {
    expect(
      computeGovernanceHealth({
        ...sampleSnapshot(),
        featureFlagsConfig: { enterprise_governance_center_v1: false } as GovernanceSnapshot["featureFlagsConfig"],
      }).status,
    ).toBe("failed");
  });

  it("validates readiness", () => {
    expect(validateGovernanceReadiness(sampleSnapshot()).ready).toBe(true);
  });
});

describe("api routes", () => {
  it("exposes snapshot api", () => {
    expect(ENTERPRISE_GOVERNANCE_API.snapshot).toBe("/api/super-admin/governance");
  });

  it("exposes governance endpoints", () => {
    expect(ENTERPRISE_GOVERNANCE_API.scan).toContain("scan");
    expect(ENTERPRISE_GOVERNANCE_API.validate).toContain("validate");
    expect(ENTERPRISE_GOVERNANCE_API.certify).toContain("certify");
    expect(ENTERPRISE_GOVERNANCE_API.score).toContain("score");
    expect(ENTERPRISE_GOVERNANCE_API.debt).toContain("debt");
    expect(ENTERPRISE_GOVERNANCE_API.export).toContain("export");
  });

  it("exposes v1 snapshot", () => {
    expect(ENTERPRISE_GOVERNANCE_API.v1Snapshot).toContain("/api/v1/");
  });
});
