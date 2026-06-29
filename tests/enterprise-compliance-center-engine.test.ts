import { describe, expect, it } from "vitest";
import { canModifyRetentionPolicy, canPerformComplianceExport } from "@/lib/enterprise-compliance-center-engine/audit";
import {
  buildAuditTimeline,
  buildCertificationDashboard,
  buildChangeTimeline,
  buildCompliancePolicies,
  buildComplianceTimeline,
  buildEvidenceVault,
  buildOriComplianceAnalysis,
  computeComplianceScores,
  filterAuditTimeline,
  verifyIntegrity,
} from "@/lib/enterprise-compliance-center-engine/builder";
import { createDefaultEnterpriseComplianceSettings } from "@/lib/enterprise-compliance-center-engine/engine";
import {
  buildAuditReadinessScore,
  buildEnterpriseDashboard,
  buildGapAnalysis,
  buildOriAuditIntelligence,
  buildRemediationItems,
  runPreAuditSimulation,
  validateAuditReadinessReadiness,
} from "@/lib/enterprise-compliance-center-engine/readiness";
import {
  CERTIFICATION_READINESS_ITEMS,
  COMPLIANCE_EXPORT_TYPES,
  COMPLIANCE_POLICIES,
  ENTERPRISE_COMPLIANCE_ROUTES,
  READINESS_TARGET_SCORE,
} from "@/lib/enterprise-compliance-center-engine/registry";
import type { EnterpriseComplianceLiveContext } from "@/lib/enterprise-compliance-center-engine/live";
import { createDefaultAuditComplianceEngineDocument } from "@/lib/audit-compliance-engine/defaults";

function mockContext(overrides?: Partial<EnterpriseComplianceLiveContext>): EnterpriseComplianceLiveContext {
  const doc = createDefaultAuditComplianceEngineDocument("Live");
  return {
    auditSnapshot: {
      scannedAt: new Date().toISOString(),
      scores: {
        platformHealth: 88,
        compliance: 86,
        security: 90,
        performance: 85,
        accessibility: 92,
        infrastructure: 84,
        marketplaceReadiness: 82,
        productionReadiness: 87,
        riskScore: 12,
        activeWarnings: 2,
        criticalIssues: 0,
      },
      modules: [{ id: "enterprise-core", label: "Enterprise Core", icon: "⚡", score: 90, status: "passed", issues: 0, warnings: 0 }],
      findings: [{ id: "f1", module: "security-engine", category: "security", title: "Review API rate limits", severity: "warning", recommendation: "Verify limits" }],
      compliance: [{ id: "gdpr", label: "GDPR", percentage: 88, status: "information", missingEvidence: ["DPIA documentation"], recommendations: [], certificationReady: false }],
      runs: [{ id: "run-1", runAt: new Date().toISOString(), administrator: "admin", version: "1.0", modulesScanned: 10, issuesFound: 1, issuesResolved: 1, certificationStatus: "ready", riskScore: 10, durationMs: 1000 }],
      reports: [{ id: "r1", label: "Compliance Report", type: "compliance", generatedAt: new Date().toISOString(), format: "pdf", status: "ready" }],
      schedule: { enabled: true, nightlyValidation: true, weeklyCertificationScan: true, monthlyComplianceReport: true, continuousValidation: true },
      recommendations: ["Maintain controls"],
      draft: doc,
      live: doc,
      history: [],
    },
    certificationSnapshot: {
      scannedAt: new Date().toISOString(),
      dashboard: { overallStatus: "production-ready", productionReadiness: 87, complianceReadiness: 86, securityReadiness: 90, performanceReadiness: 85, infrastructureReadiness: 84, recoveryReadiness: 88, aiReadiness: 80, marketplaceReadiness: 82, finalRiskScore: 12 },
      scorecard: { security: 90, performance: 85, accessibility: 92, compliance: 86, reliability: 88, scalability: 85, maintainability: 87, observability: 86, marketplaceHealth: 82, overallEnterpriseScore: 87 },
      modules: [],
      validations: [],
      approvals: [],
      history: [],
      reports: [],
      schedule: { enabled: true, manualValidation: true, scheduledValidation: true, nightlyValidation: true, preReleaseValidation: true, continuousMonitoring: true },
      recommendations: [],
      draft: {} as never,
      live: {} as never,
      configHistory: [],
    },
    auditLogs: [{ id: "log-1", action: "incident_command_center.change", actorId: "admin-1", resourceType: "incident_command_center", resourceId: "x", metadata: { role: "Super Admin", requireMfa: true }, createdAt: new Date().toISOString() }],
    auditLogsError: null,
    incidentReports: [{ id: "ir-1", label: "Incident Report", format: "pdf", generatedAt: new Date().toISOString() }],
    timelineExports: [{ id: "te-1", label: "Timeline Export", format: "csv", generatedAt: new Date().toISOString() }],
    ...overrides,
  };
}

describe("enterprise audit readiness & certification intelligence v2.0", () => {
  it("registers SA-008 routes", () => {
    expect(ENTERPRISE_COMPLIANCE_ROUTES.length).toBe(10);
    expect(ENTERPRISE_COMPLIANCE_ROUTES.some((r) => r.href.includes("/readiness"))).toBe(true);
    expect(ENTERPRISE_COMPLIANCE_ROUTES.some((r) => r.href.includes("/pre-audit"))).toBe(true);
  });

  it("registers certification readiness items", () => {
    expect(CERTIFICATION_READINESS_ITEMS.length).toBe(8);
    expect(CERTIFICATION_READINESS_ITEMS.some((c) => c.id === "rovexo-trust")).toBe(true);
  });

  it("registers export types including pre-audit report", () => {
    expect(COMPLIANCE_EXPORT_TYPES.some((e) => e.id === "pre-audit-report")).toBe(true);
    expect(COMPLIANCE_EXPORT_TYPES.some((e) => e.id === "gap-analysis-report")).toBe(true);
  });

  it("builds audit readiness score from live data", () => {
    const ctx = mockContext();
    const settings = createDefaultEnterpriseComplianceSettings();
    const evidence = buildEvidenceVault(ctx, settings);
    const integrity = verifyIntegrity({ auditTimeline: buildAuditTimeline(ctx), changeTimeline: [], evidenceVault: evidence, ctx });
    const readiness = buildAuditReadinessScore({ ctx, evidenceVault: evidence, integrity, previousScore: 80 });
    expect(readiness.currentScore).toBeGreaterThan(0);
    expect(readiness.target).toBe(READINESS_TARGET_SCORE);
    expect(readiness.trend).toBeDefined();
  });

  it("builds enterprise dashboard metrics", () => {
    const ctx = mockContext();
    const settings = createDefaultEnterpriseComplianceSettings();
    const evidence = buildEvidenceVault(ctx, settings);
    const integrity = verifyIntegrity({ auditTimeline: [], changeTimeline: [], evidenceVault: evidence, ctx });
    const readiness = buildAuditReadinessScore({ ctx, evidenceVault: evidence, integrity, previousScore: null });
    const gaps = buildGapAnalysis(ctx);
    const remediation = buildRemediationItems(gaps);
    const certs = buildCertificationDashboard(ctx);
    const dashboard = buildEnterpriseDashboard({ ctx, readiness, evidenceVault: evidence, remediation, certifications: certs });
    expect(dashboard.overallReadiness).toBe(readiness.currentScore);
    expect(dashboard.openFindings).toBeGreaterThanOrEqual(1);
  });

  it("runs pre-audit simulation with verified vs AI sections", () => {
    const ctx = mockContext();
    const gaps = buildGapAnalysis(ctx);
    const sim = runPreAuditSimulation(ctx, gaps);
    expect(sim.estimatedReadiness).toBeGreaterThan(0);
    expect(["pass", "conditional", "fail"]).toContain(sim.estimatedOutcome);
    expect(sim.priorityActions.length).toBeGreaterThan(0);
  });

  it("builds gap analysis from findings and compliance", () => {
    const gaps = buildGapAnalysis(mockContext());
    expect(gaps.some((g) => g.source === "verified")).toBe(true);
    expect(gaps.some((g) => g.category === "evidence")).toBe(true);
  });

  it("builds remediation items from gaps", () => {
    const gaps = buildGapAnalysis(mockContext());
    const items = buildRemediationItems(gaps);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.owner).toBeDefined();
    expect(items[0]?.dueDate).toBeDefined();
  });

  it("builds ORI audit intelligence", () => {
    const ctx = mockContext();
    const gaps = buildGapAnalysis(ctx);
    const settings = createDefaultEnterpriseComplianceSettings();
    const evidence = buildEvidenceVault(ctx, settings);
    const integrity = verifyIntegrity({ auditTimeline: [], changeTimeline: [], evidenceVault: evidence, ctx });
    const readiness = buildAuditReadinessScore({ ctx, evidenceVault: evidence, integrity, previousScore: null });
    const ori = buildOriAuditIntelligence({ ctx, readiness, gapAnalysis: gaps, complianceTimeline: buildComplianceTimeline(ctx) });
    expect(ori.verifiedFindings.length).toBeGreaterThan(0);
    expect(ori.estimatedAuditDifficulty).toBeDefined();
  });

  it("builds enhanced certification dashboard", () => {
    const certs = buildCertificationDashboard(mockContext());
    expect(certs.length).toBe(8);
    expect(certs[0]?.completedControls).toBeGreaterThan(0);
    expect(certs[0]?.estimatedReadiness).toBeGreaterThan(0);
  });

  it("includes retention status on evidence", () => {
    const vault = buildEvidenceVault(mockContext(), createDefaultEnterpriseComplianceSettings());
    expect(vault[0]?.retentionStatus).toBeDefined();
    expect(vault.some((v) => v.category === "policy")).toBe(true);
  });

  it("requires MFA for exports", () => {
    const settings = createDefaultEnterpriseComplianceSettings();
    expect(canPerformComplianceExport(settings).allowed).toBe(true);
    expect(canPerformComplianceExport({ ...settings, requireMfaForExport: false }).allowed).toBe(false);
  });

  it("validates audit readiness readiness", () => {
    const ctx = mockContext();
    const gaps = buildGapAnalysis(ctx);
    const settings = createDefaultEnterpriseComplianceSettings();
    const evidence = buildEvidenceVault(ctx, settings);
    const integrity = verifyIntegrity({ auditTimeline: [], changeTimeline: [], evidenceVault: evidence, ctx });
    const readiness = buildAuditReadinessScore({ ctx, evidenceVault: evidence, integrity, previousScore: null });
    const sim = runPreAuditSimulation(ctx, gaps);
    const { ready } = validateAuditReadinessReadiness({ readiness, gapAnalysis: gaps, preAudit: sim });
    expect(typeof ready).toBe("boolean");
  });

  it("builds audit timeline from platform logs", () => {
    expect(buildAuditTimeline(mockContext()).length).toBeGreaterThan(0);
  });

  it("computes compliance scores", () => {
    const integrity = verifyIntegrity({ auditTimeline: [], changeTimeline: [], evidenceVault: [], ctx: mockContext() });
    const scores = computeComplianceScores(integrity, 87, 86);
    expect(scores.integrityScore).toBeLessThanOrEqual(100);
  });

  it("filters audit timeline", () => {
    const timeline = buildAuditTimeline(mockContext());
    expect(filterAuditTimeline(timeline, "incident").length).toBeGreaterThan(0);
  });

  it("builds compliance policies", () => {
    expect(buildCompliancePolicies().length).toBe(COMPLIANCE_POLICIES.length);
  });

  it("builds ORI compliance analysis", () => {
    const ctx = mockContext();
    const integrity = verifyIntegrity({ auditTimeline: [], changeTimeline: [], evidenceVault: [], ctx });
    const ori = buildOriComplianceAnalysis(ctx, buildComplianceTimeline(ctx), integrity);
    expect(ori.confirmedFindings.length).toBeGreaterThan(0);
  });

  it("generates unique source hashes per audit record", () => {
    const timeline = buildAuditTimeline(mockContext());
    const hashes = timeline.map((t) => t.sourceHash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("defaults append-only audit storage", () => {
    expect(createDefaultEnterpriseComplianceSettings().appendOnlyAudit).toBe(true);
  });
});
