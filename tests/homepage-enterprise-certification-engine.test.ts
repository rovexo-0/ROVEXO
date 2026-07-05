import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformHomepageCertificationAction, requiresMfaForHomepageCertification } from "@/lib/homepage-enterprise-certification-engine/audit";
import { isHomepageCertificationConfigAction } from "@/lib/homepage-enterprise-certification-engine/config-actions";
import { HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR } from "@/lib/homepage-enterprise-certification-engine/descriptor";
import {
  advanceCertificationRun,
  analyzeFailure,
  computeHomepageEnterpriseScore,
  computeOverallPassPercent,
  countCertifiedSections,
  createDefaultHomepageCertificationSettings,
  createDefaultHomepageCertificationState,
  isCertificationEligible,
  isProtectedHomepageTarget,
  runFullHomepageValidation,
  runHomepageIntegrityValidation,
  scanHomepageSections,
  startCertificationRun,
} from "@/lib/homepage-enterprise-certification-engine/engine";
import { exportHomepageCertificationSnapshot, isValidHomepageCertificationExportFormat } from "@/lib/homepage-enterprise-certification-engine/export";
import { computeHomepageCertificationHealth } from "@/lib/homepage-enterprise-certification-engine/health";
import { validateHomepageCertificationReadiness } from "@/lib/homepage-enterprise-certification-engine/reader";
import {
  ACCESSIBILITY_CHECKS,
  BUTTON_INTERACTION_CHECKS,
  CERTIFICATION_STAGES,
  HOMEPAGE_CERTIFICATION_API,
  HOMEPAGE_CERTIFICATION_ROUTES,
  HOMEPAGE_SECTIONS,
  LISTING_VALIDATION_CHECKS,
  OMEGA_CERTIFICATION_SCORES,
  PERFORMANCE_METRICS,
  PROTECTED_AREAS,
  REPORT_TYPES,
  RESPONSIVE_BREAKPOINTS,
  SEARCH_VALIDATION_CHECKS,
  SEO_CHECKS,
} from "@/lib/homepage-enterprise-certification-engine/registry";
import type { HomepageCertificationSnapshot } from "@/lib/homepage-enterprise-certification-engine/types";

function sampleSnapshot(): HomepageCertificationSnapshot {
  const state = createDefaultHomepageCertificationState();
  const settings = createDefaultHomepageCertificationSettings();
  return {
    tab: "dashboard",
    ...state,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      homepage_enterprise_certification_engine_v1: true,
      section_validation_enabled: true,
      button_validation_enabled: true,
      search_validation_enabled: true,
      responsive_validation_enabled: true,
      performance_validation_enabled: true,
      accessibility_validation_enabled: true,
      seo_validation_enabled: true,
      validation_only_mode: true,
      omega_score_engine_enabled: true,
      require_pass_100: true,
      homepage_integrity_engine_v1: true,
      category_duplication_detection: true,
      layout_optimization_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: state.dashboard.enterpriseScore, message: "ok" },
  };
}

describe("homepage enterprise certification descriptor", () => {
  it("registers module id", () => {
    expect(HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.id).toBe("homepage-enterprise-certification-engine");
  });

  it("auto registers", () => {
    expect(HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/homepage-certification");
  });

  it("has master feature flag", () => {
    expect(HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("homepage_enterprise_certification_engine_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("homepage-enterprise-certification-engine")?.id).toBe("homepage-enterprise-certification-engine");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("homepage-enterprise-certification-engine")?.moduleId).toBe("homepage-enterprise-certification-engine");
  });
});

describe("homepage enterprise certification registry constants", () => {
  it("defines homepage sections", () => {
    expect(HOMEPAGE_SECTIONS).toContain("category-rail");
    expect(HOMEPAGE_SECTIONS).not.toContain("bring-items");
    expect(HOMEPAGE_SECTIONS).toContain("bottom-navigation");
    expect(HOMEPAGE_SECTIONS.length).toBe(13);
  });

  it("defines button and search checks", () => {
    expect(BUTTON_INTERACTION_CHECKS).toContain("keyboard-navigation");
    expect(SEARCH_VALIDATION_CHECKS).toContain("autocomplete");
  });

  it("defines omega certification scores", () => {
    expect(OMEGA_CERTIFICATION_SCORES).toContain("ux");
    expect(OMEGA_CERTIFICATION_SCORES).toContain("visual-integrity");
    expect(OMEGA_CERTIFICATION_SCORES).toContain("homepage-integrity");
    expect(OMEGA_CERTIFICATION_SCORES).toContain("enterprise");
    expect(OMEGA_CERTIFICATION_SCORES.length).toBe(12);
  });

  it("defines routes and api", () => {
    expect(HOMEPAGE_CERTIFICATION_ROUTES.length).toBe(12);
    expect(HOMEPAGE_CERTIFICATION_ROUTES.some((r) => r.id === "integrity")).toBe(true);
    expect(HOMEPAGE_CERTIFICATION_API.snapshot).toBe("/api/super-admin/homepage-certification");
    expect(HOMEPAGE_CERTIFICATION_API.certify).toBe("/api/super-admin/homepage-certification/certify");
  });

  it("defines protected areas", () => {
    expect(PROTECTED_AREAS).toContain("payments");
    expect(PROTECTED_AREAS).toContain("marketplace-business-logic");
  });
});

describe("homepage enterprise certification engine", () => {
  it("creates default state with certification data", () => {
    const state = createDefaultHomepageCertificationState();
    expect(state.sections.length).toBe(HOMEPAGE_SECTIONS.length);
    expect(state.omegaScores.length).toBe(OMEGA_CERTIFICATION_SCORES.length);
    expect(state.search.length).toBe(SEARCH_VALIDATION_CHECKS.length);
    expect(state.listings.length).toBe(LISTING_VALIDATION_CHECKS.length);
    expect(state.integrity.length).toBe(5);
    expect(state.integrityScan.certificationEligible).toBe(true);
    expect(state.engineeringScan.status).toBe("pass");
    expect(state.engineeringScan.passPercent).toBe(100);
    expect(state.engineeringScan.productionReady).toBe(true);
  });

  it("computes enterprise score at 100", () => {
    const state = createDefaultHomepageCertificationState();
    const score = computeHomepageEnterpriseScore(state);
    expect(score).toBe(100);
  });

  it("computes overall pass percent at 100", () => {
    const state = createDefaultHomepageCertificationState();
    expect(computeOverallPassPercent(state)).toBe(100);
  });

  it("runs full homepage validation", () => {
    const result = runFullHomepageValidation();
    expect(result.status).toBe("pass");
    expect(result.passPercent).toBe(100);
    expect(result.scores.length).toBe(OMEGA_CERTIFICATION_SCORES.length);
    expect(result.integrityScan.certificationEligible).toBe(true);
    expect(result.engineeringScan.certificationEligible).toBe(true);
    expect(result.engineeringScan.passPercent).toBe(100);
  });

  it("runs homepage integrity validation", () => {
    const result = runHomepageIntegrityValidation("enterprise-certification");
    expect(result.certificationEligible).toBe(true);
    expect(result.integrity.length).toBe(5);
  });

  it("starts and advances certification run", () => {
    const run = startCertificationRun("test-user");
    expect(run.stage).toBe("section-validation");
    const advanced = advanceCertificationRun(run);
    expect(advanced.stage).not.toBe("section-validation");
  });

  it("analyzes failures with protected area blocking", () => {
    const open = analyzeFailure("Category rail spacing issue");
    expect(open.validationOnly).toBe(true);
    expect(open.status).not.toBe("blocked");
    const blocked = analyzeFailure("Payment widget issue", "payments");
    expect(blocked.status).toBe("blocked");
  });

  it("detects protected homepage targets", () => {
    expect(isProtectedHomepageTarget("payments")).toBe(true);
    expect(isProtectedHomepageTarget("category-rail")).toBe(false);
  });

  it("scans homepage sections", () => {
    const sections = scanHomepageSections();
    expect(sections.length).toBe(HOMEPAGE_SECTIONS.length);
    expect(sections.every((s) => s.passPercent === 100)).toBe(true);
  });

  it("counts certified sections", () => {
    const state = createDefaultHomepageCertificationState();
    expect(countCertifiedSections(state.sections)).toBe(HOMEPAGE_SECTIONS.length);
  });

  it("checks certification eligibility at 100%", () => {
    const state = createDefaultHomepageCertificationState();
    expect(isCertificationEligible(state.dashboard, state.omegaScores, state.integrityScan, state.engineeringScan)).toBe(true);
  });
});

describe("homepage enterprise certification export and health", () => {
  it("exports snapshot formats", () => {
    const snapshot = sampleSnapshot();
    expect(isValidHomepageCertificationExportFormat("json")).toBe(true);
    expect(exportHomepageCertificationSnapshot(snapshot, "json")).toContain("exportedAt");
    expect(exportHomepageCertificationSnapshot(snapshot, "csv")).toContain("componentRef");
    expect(exportHomepageCertificationSnapshot(snapshot, "pdf")).toContain("Overall PASS");
  });

  it("computes health checks", () => {
    const snapshot = sampleSnapshot();
    const health = computeHomepageCertificationHealth(snapshot);
    expect(health.checks.length).toBeGreaterThan(0);
  });

  it("validates readiness", () => {
    const snapshot = sampleSnapshot();
    const readiness = validateHomepageCertificationReadiness(snapshot);
    expect(readiness.ready).toBe(true);
    expect(readiness.score).toBeGreaterThanOrEqual(80);
  });
});

describe("homepage enterprise certification audit and permissions", () => {
  it("maps config actions", () => {
    expect(isHomepageCertificationConfigAction("publish-config")).toBe(true);
    expect(isHomepageCertificationConfigAction("validate")).toBe(false);
  });

  it("requires mfa for certify", () => {
    expect(requiresMfaForHomepageCertification("certify")).toBe(true);
    expect(requiresMfaForHomepageCertification("validate")).toBe(false);
  });

  it("allows validate for super-admin role mapping", () => {
    const result = canPerformHomepageCertificationAction({ action: "validate" });
    expect(result.allowed).toBe(true);
  });
});

describe("homepage enterprise certification domains", () => {
  it("tracks responsive breakpoints", () => {
    expect(RESPONSIVE_BREAKPOINTS).toContain("mobile");
    expect(RESPONSIVE_BREAKPOINTS).toContain("safe-areas");
  });

  it("tracks performance metrics", () => {
    expect(PERFORMANCE_METRICS).toContain("largest-contentful-paint");
    expect(PERFORMANCE_METRICS).toContain("cumulative-layout-shift");
    expect(PERFORMANCE_METRICS).toContain("interaction-to-next-paint");
    expect(PERFORMANCE_METRICS).toContain("lazy-loading");
    expect(PERFORMANCE_METRICS.length).toBe(9);
  });

  it("tracks accessibility and seo checks", () => {
    expect(ACCESSIBILITY_CHECKS).toContain("reduced-motion");
    expect(SEO_CHECKS).toContain("structured-data");
  });

  it("tracks certification stages and report types", () => {
    expect(CERTIFICATION_STAGES).toContain("homepage-integrity-scan");
    expect(CERTIFICATION_STAGES).toContain("certification-grant");
    expect(REPORT_TYPES).toContain("integrity");
    expect(REPORT_TYPES).toContain("omega-scores");
  });
});
