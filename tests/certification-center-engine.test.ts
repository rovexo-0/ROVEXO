import { describe, expect, it } from "vitest";
import { createCertificationCenterEngineAuditEntry } from "@/lib/certification-center-engine/audit";
import { createDefaultCertificationApprovals, createDefaultCertificationCenterEngineDocument } from "@/lib/certification-center-engine/defaults";
import {
  CERTIFICATION_CENTER_APPROVALS_KEY,
  CERTIFICATION_CENTER_ENGINE_LIVE_KEY,
  CERTIFICATION_CENTER_RUNS_KEY,
} from "@/lib/certification-center-engine/keys";
import {
  CERTIFICATION_APPROVAL_STAGES,
  CERTIFICATION_EXPORT_FORMATS,
  CERTIFICATION_LEVELS,
  CERTIFICATION_MODULES,
  CERTIFICATION_REPORT_TYPES,
  RELEASE_VALIDATION_CHECKS,
} from "@/lib/certification-center-engine/registry";
import {
  buildCertificationDashboard,
  buildCertificationModuleResults,
  buildCertificationRecommendations,
  buildCertificationReports,
  buildCertificationScorecard,
  buildExportPayload,
  buildReleaseValidationChecks,
  calculateCertificationRisk,
  canPerformCertificationAction,
  countEnabledFlags,
  getNextApprovalStage,
  resolveCertificationLevel,
  searchCertificationData,
  validateCertificationReadiness,
} from "@/lib/certification-center-engine/timeline";

const doc = createDefaultCertificationCenterEngineDocument();
const modules = buildCertificationModuleResults({ config: doc, errorCount: 0, healthStatus: "healthy" });
const scorecard = buildCertificationScorecard({ modules, errorCount: 0, healthStatus: "healthy" });
const validations = buildReleaseValidationChecks({
  config: doc,
  errorCount: 0,
  healthStatus: "healthy",
  operations: { environment: { supabase: true, stripe: true, resend: true, redis: true, cron: true, appUrl: true } } as never,
});
const approvals = createDefaultCertificationApprovals();

describe("certification center engine", () => {
  it("creates default document with UK v1 configuration", () => {
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.releaseValidation.productionBuild).toBe(true);
    expect(doc.workflow.executiveApproval).toBe(true);
    expect(doc.security.auditProtected).toBe(true);
    expect(doc.integrations.auditCenter).toBe(true);
  });

  it("registers twenty-one certification modules", () => {
    expect(CERTIFICATION_MODULES.length).toBe(26);
    expect(CERTIFICATION_MODULES.some((m) => m.id === "audit-compliance-center")).toBe(true);
    expect(CERTIFICATION_MODULES.some((m) => m.id === "recovery-center")).toBe(true);
  });

  it("registers certification levels and approval stages", () => {
    expect(CERTIFICATION_LEVELS).toContain("certified");
    expect(CERTIFICATION_LEVELS).toContain("production-ready");
    expect(CERTIFICATION_APPROVAL_STAGES.length).toBe(8);
  });

  it("builds certification module results", () => {
    const results = buildCertificationModuleResults({ config: doc, errorCount: 1, healthStatus: "healthy" });
    expect(results.length).toBe(26);
    expect(results.every((m) => m.score >= 40)).toBe(true);
  });

  it("builds enterprise scorecard", () => {
    expect(scorecard.overallEnterpriseScore).toBeGreaterThan(60);
    expect(scorecard.security).toBeGreaterThan(60);
    expect(scorecard.marketplaceHealth).toBeGreaterThan(50);
  });

  it("builds certification dashboard readiness metrics", () => {
    const dashboard = buildCertificationDashboard({ scorecard, modules, criticalCount: 0, approvals });
    expect(dashboard.productionReadiness).toBeGreaterThan(60);
    expect(dashboard.aiReadiness).toBeGreaterThan(40);
    expect(dashboard.finalRiskScore).toBeGreaterThanOrEqual(0);
  });

  it("builds release validation checks", () => {
    expect(RELEASE_VALIDATION_CHECKS.length).toBe(15);
    expect(validations.every((v) => typeof v.passed === "boolean")).toBe(true);
    expect(validations.some((v) => v.id === "production-build")).toBe(true);
  });

  it("validates certification readiness before release", () => {
    const ready = validateCertificationReadiness({ validations, criticalModules: 0 });
    const blocked = validateCertificationReadiness({
      validations: validations.map((v) => ({ ...v, passed: false })),
      criticalModules: 2,
    });
    expect(ready.ready).toBe(true);
    expect(blocked.ready).toBe(false);
    expect(blocked.blockers.length).toBeGreaterThan(0);
  });

  it("builds certification reports", () => {
    const reports = buildCertificationReports(new Date().toISOString());
    expect(reports.length).toBe(CERTIFICATION_REPORT_TYPES.length);
    expect(reports.some((r) => r.type === "production-certification")).toBe(true);
  });

  it("calculates certification risk score", () => {
    const risk = calculateCertificationRisk({
      validations: [{ id: "1", label: "Fail", category: "build", passed: false, detail: "" }],
      modules: [{ id: "enterprise-core", label: "Core", icon: "⚡", score: 40, status: "critical", certified: false }],
    });
    expect(risk).toBeGreaterThan(0);
  });

  it("searches certification data", () => {
    const results = searchCertificationData({ query: "enterprise", modules, history: [], validations });
    expect(results.modules.some((m) => m.id === "enterprise-core")).toBe(true);
  });

  it("enforces super admin permissions", () => {
    expect(canPerformCertificationAction(doc, "superAdminRunCertification")).toBe(true);
    expect(canPerformCertificationAction(doc, "superAdminApprove")).toBe(true);
    expect(canPerformCertificationAction(doc, "superAdminRevoke")).toBe(true);
    expect(canPerformCertificationAction(doc, "superAdminExport")).toBe(true);
  });

  it("creates immutable audit log entries", () => {
    const entry = createCertificationCenterEngineAuditEntry({
      administrator: "admin-1",
      module: "certification-center",
      action: "approve",
    });
    expect(entry.action).toBe("approve");
    expect(entry.rollbackAvailable).toBe(true);
  });

  it("exposes API storage keys and export formats", () => {
    expect(CERTIFICATION_CENTER_ENGINE_LIVE_KEY).toBe("certification_center_engine_live_v1");
    expect(CERTIFICATION_CENTER_RUNS_KEY).toBe("certification_center_runs_v1");
    expect(CERTIFICATION_CENTER_APPROVALS_KEY).toBe("certification_center_approvals_v1");
    expect(CERTIFICATION_EXPORT_FORMATS).toContain("pdf");
    expect(countEnabledFlags(doc.modules)).toBe(26);
  });

  it("builds export payloads for release reports", () => {
    const dashboard = buildCertificationDashboard({ scorecard, modules, criticalCount: 0, approvals });
    const json = buildExportPayload({ dashboard, scorecard, modules, format: "json" });
    const markdown = buildExportPayload({ dashboard, scorecard, modules, format: "markdown" });
    expect(json).toHaveProperty("scorecard");
    expect(typeof markdown).toBe("string");
  });

  it("resolves approval workflow stages", () => {
    expect(getNextApprovalStage(approvals)?.stage).toBe("review");
    expect(resolveCertificationLevel(approvals)).toBe("draft");
  });

  it("builds certification recommendations", () => {
    const recommendations = buildCertificationRecommendations({ validations, modules });
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it("marks modules certified above threshold", () => {
    const certified = modules.filter((m) => m.certified);
    expect(certified.length).toBeGreaterThan(15);
  });

  it("reflects degraded health in module scores", () => {
    const degraded = buildCertificationModuleResults({ config: doc, errorCount: 5, healthStatus: "unhealthy" });
    const healthy = buildCertificationModuleResults({ config: doc, errorCount: 0, healthStatus: "healthy" });
    const degradedAvg = degraded.reduce((s, m) => s + m.score, 0) / degraded.length;
    const healthyAvg = healthy.reduce((s, m) => s + m.score, 0) / healthy.length;
    expect(degradedAvg).toBeLessThan(healthyAvg);
  });

  it("tracks release validation categories", () => {
    const categories = new Set(validations.map((v) => v.category));
    expect(categories.has("build")).toBe(true);
    expect(categories.has("recovery")).toBe(true);
  });
});
