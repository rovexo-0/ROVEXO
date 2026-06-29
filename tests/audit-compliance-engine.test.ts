import { describe, expect, it } from "vitest";
import { createAuditComplianceEngineAuditEntry } from "@/lib/audit-compliance-engine/audit";
import { createDefaultAuditComplianceEngineDocument } from "@/lib/audit-compliance-engine/defaults";
import {
  AUDIT_COMPLIANCE_ENGINE_LIVE_KEY,
  AUDIT_COMPLIANCE_RUNS_KEY,
  AUDIT_COMPLIANCE_SCHEDULE_KEY,
} from "@/lib/audit-compliance-engine/keys";
import {
  AUDIT_ACCESSIBILITY_CHECKS,
  AUDIT_COMPLIANCE_MODULES,
  AUDIT_COMPLIANCE_STANDARDS,
  AUDIT_EXPORT_FORMATS,
  AUDIT_REPORT_TYPES,
  AUDIT_SECURITY_CHECKS,
  AUDIT_SEO_CHECKS,
} from "@/lib/audit-compliance-engine/registry";
import {
  buildAccessibilityFindings,
  buildAuditRecommendations,
  buildAuditScoreCard,
  buildCertificationReports,
  buildComplianceStandards,
  buildExportPayload,
  buildModuleAuditResults,
  buildPerformanceFindings,
  buildSecurityFindings,
  buildSeoFindings,
  calculateRiskScore,
  canPerformAuditAction,
  countEnabledFlags,
  mergeFindings,
  searchAuditData,
  validateSchedule,
} from "@/lib/audit-compliance-engine/timeline";

const doc = createDefaultAuditComplianceEngineDocument();
const baseModules = buildModuleAuditResults({ config: doc, errorCount: 0, healthStatus: "healthy" });
const baseFindings = mergeFindings(buildSecurityFindings({ errorCount: 0, env: { supabase: true, stripe: true, resend: true, redis: true, cron: true, appUrl: true } }), buildAccessibilityFindings(), buildSeoFindings());
const baseScores = buildAuditScoreCard({ modules: baseModules, findings: baseFindings, healthStatus: "healthy", errorCount: 0 });

describe("audit compliance engine", () => {
  it("creates default document with UK v1 configuration", () => {
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.validation.security).toBe(true);
    expect(doc.monitoring.weeklyCertificationScan).toBe(true);
    expect(doc.security.auditProtected).toBe(true);
    expect(doc.integrations.complianceCenter).toBe(true);
  });

  it("registers twenty enterprise audit modules", () => {
    expect(AUDIT_COMPLIANCE_MODULES.length).toBe(20);
    expect(AUDIT_COMPLIANCE_MODULES.some((m) => m.id === "operations-center")).toBe(true);
    expect(AUDIT_COMPLIANCE_MODULES.some((m) => m.id === "recovery-center")).toBe(true);
  });

  it("builds module audit results for audit engine", () => {
    const modules = buildModuleAuditResults({ config: doc, errorCount: 2, healthStatus: "degraded" });
    expect(modules.length).toBe(20);
    expect(modules.every((m) => m.score >= 40)).toBe(true);
  });

  it("builds security validation findings", () => {
    expect(AUDIT_SECURITY_CHECKS.length).toBe(16);
    const findings = buildSecurityFindings({ errorCount: 12, env: { supabase: true, stripe: false, resend: true, redis: true, cron: true, appUrl: true } });
    expect(findings.some((f) => f.category === "security")).toBe(true);
  });

  it("builds performance validation findings", () => {
    const findings = buildPerformanceFindings({
      health: { checks: { api: { latencyMs: 650 } } } as never,
      operations: { errors: [{ id: "1" }, { id: "2" }] } as never,
    });
    expect(findings.some((f) => f.category === "performance")).toBe(true);
  });

  it("builds accessibility validation findings", () => {
    expect(AUDIT_ACCESSIBILITY_CHECKS.length).toBe(9);
    const findings = buildAccessibilityFindings();
    expect(findings.every((f) => f.category === "accessibility")).toBe(true);
  });

  it("builds seo validation findings", () => {
    expect(AUDIT_SEO_CHECKS.length).toBe(9);
    const findings = buildSeoFindings();
    expect(findings.every((f) => f.category === "seo")).toBe(true);
  });

  it("builds compliance engine standards", () => {
    expect(AUDIT_COMPLIANCE_STANDARDS.length).toBe(8);
    const compliance = buildComplianceStandards({ scores: baseScores, findings: baseFindings });
    expect(compliance.some((c) => c.id === "uk-gdpr")).toBe(true);
    expect(compliance.every((c) => c.percentage >= 45)).toBe(true);
  });

  it("builds certification reports", () => {
    const reports = buildCertificationReports(new Date().toISOString());
    expect(reports.length).toBe(AUDIT_REPORT_TYPES.length);
    expect(reports.some((r) => r.type === "enterprise-certification")).toBe(true);
  });

  it("calculates enterprise risk score", () => {
    const risk = calculateRiskScore([
      { id: "1", module: "security-engine", category: "security", title: "Critical", severity: "critical" },
      { id: "2", module: "operations-center", category: "performance", title: "Warning", severity: "warning" },
    ]);
    expect(risk).toBe(20);
  });

  it("searches audit data by module and severity", () => {
    const results = searchAuditData({
      query: "wcag",
      modules: baseModules,
      findings: baseFindings,
      runs: [],
      compliance: buildComplianceStandards({ scores: baseScores, findings: baseFindings }),
    });
    expect(results.findings.length).toBeGreaterThan(0);
  });

  it("enforces super admin permissions for audit actions", () => {
    expect(canPerformAuditAction(doc, "superAdminFullAudit")).toBe(true);
    expect(canPerformAuditAction(doc, "superAdminExport")).toBe(true);
    expect(canPerformAuditAction(doc, "superAdminModifyRules")).toBe(true);
  });

  it("creates immutable audit log entries", () => {
    const entry = createAuditComplianceEngineAuditEntry({
      administrator: "admin-1",
      module: "audit-compliance",
      action: "run-audit",
    });
    expect(entry.action).toBe("run-audit");
    expect(entry.rollbackAvailable).toBe(true);
  });

  it("exposes API storage keys and export formats", () => {
    expect(AUDIT_COMPLIANCE_ENGINE_LIVE_KEY).toBe("audit_compliance_engine_live_v1");
    expect(AUDIT_COMPLIANCE_RUNS_KEY).toBe("audit_compliance_runs_v1");
    expect(AUDIT_COMPLIANCE_SCHEDULE_KEY).toBe("audit_compliance_schedule_v1");
    expect(AUDIT_EXPORT_FORMATS).toContain("markdown");
    expect(countEnabledFlags(doc.modules)).toBe(20);
  });

  it("builds export payloads for certification reports", () => {
    const json = buildExportPayload({ scores: baseScores, modules: baseModules, findings: baseFindings, compliance: buildComplianceStandards({ scores: baseScores, findings: baseFindings }), format: "json" });
    const markdown = buildExportPayload({ scores: baseScores, modules: baseModules, findings: baseFindings, compliance: buildComplianceStandards({ scores: baseScores, findings: baseFindings }), format: "markdown" });
    expect(json).toHaveProperty("scores");
    expect(typeof markdown).toBe("string");
  });

  it("validates audit schedule configuration", () => {
    const valid = validateSchedule({ enabled: true, nightlyValidation: true, weeklyCertificationScan: true, monthlyComplianceReport: true, continuousValidation: true });
    const invalid = validateSchedule({ enabled: true, nightlyValidation: false, weeklyCertificationScan: false, monthlyComplianceReport: false, continuousValidation: false });
    expect(valid.valid).toBe(true);
    expect(invalid.valid).toBe(false);
  });

  it("builds audit recommendations from findings", () => {
    const recommendations = buildAuditRecommendations(baseFindings);
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it("computes production readiness score card", () => {
    expect(baseScores.productionReadiness).toBeGreaterThan(60);
    expect(baseScores.platformHealth).toBeGreaterThan(60);
    expect(baseScores.riskScore).toBeGreaterThanOrEqual(0);
  });
});
