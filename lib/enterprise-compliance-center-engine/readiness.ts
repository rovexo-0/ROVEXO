import { COMPLIANCE_POLICIES, READINESS_TARGET_SCORE } from "@/lib/enterprise-compliance-center-engine/registry";
import type { EnterpriseComplianceLiveContext } from "@/lib/enterprise-compliance-center-engine/live";
import type {
  AuditReadinessScore,
  ComplianceHistoryEntry,
  EnterpriseDashboardMetrics,
  GapAnalysisItem,
  IntegrityVerification,
  OriAuditIntelligence,
  PreAuditSimulation,
  RemediationItem,
} from "@/lib/enterprise-compliance-center-engine/types";
import type { ComplianceTimelineRecord, EvidenceVaultItem } from "@/lib/enterprise-compliance-center-engine/types";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60_000).toISOString().slice(0, 10);
}

export function buildEnterpriseDashboard(input: {
  ctx: EnterpriseComplianceLiveContext;
  readiness: AuditReadinessScore;
  evidenceVault: EvidenceVaultItem[];
  remediation: RemediationItem[];
  certifications: { progress: number }[];
}): EnterpriseDashboardMetrics {
  const { ctx, readiness, evidenceVault, remediation, certifications } = input;
  const audit = ctx.auditSnapshot;
  const cert = ctx.certificationSnapshot;
  const openFindings = audit.findings.filter((f) => f.severity !== "passed").length;
  const closedFindings = audit.runs.reduce((sum, r) => sum + r.issuesResolved, 0);
  const evidenceHealth = evidenceVault.length
    ? Math.round((evidenceVault.filter((e) => e.integrityStatus === "verified").length / evidenceVault.length) * 100)
    : 0;
  const certProgress = certifications.length
    ? Math.round(certifications.reduce((s, c) => s + c.progress, 0) / certifications.length)
    : cert.dashboard.complianceReadiness;
  const remediationProgress = remediation.length
    ? Math.round(remediation.reduce((s, r) => s + r.completionPercent, 0) / remediation.length)
    : 100;

  return {
    overallReadiness: readiness.currentScore,
    internalAudit: audit.scores.productionReadiness,
    externalAudit: cert.scorecard.overallEnterpriseScore,
    complianceHealth: audit.scores.compliance,
    certificationProgress: certProgress,
    evidenceHealth,
    policyCoverage: Math.round((COMPLIANCE_POLICIES.length / COMPLIANCE_POLICIES.length) * 100),
    openFindings,
    closedFindings,
    riskScore: audit.scores.riskScore,
    remediationProgress,
  };
}

export function buildAuditReadinessScore(input: {
  ctx: EnterpriseComplianceLiveContext;
  evidenceVault: EvidenceVaultItem[];
  integrity: IntegrityVerification;
  previousScore: number | null;
}): AuditReadinessScore {
  const { ctx, evidenceVault, integrity, previousScore } = input;
  const audit = ctx.auditSnapshot;
  const cert = ctx.certificationSnapshot;
  const evidenceScore = evidenceVault.length
    ? Math.min(100, Math.round((evidenceVault.filter((e) => e.integrityStatus === "verified").length / evidenceVault.length) * 100))
    : Math.max(40, audit.scores.compliance - 10);
  const documentationScore = Math.max(50, audit.scores.compliance - (integrity.issues.length > 0 ? 8 : 0));
  const operational = audit.scores.productionReadiness;
  const compliance = audit.scores.compliance;
  const certification = cert.dashboard.complianceReadiness;
  const overall = Math.round((operational + compliance + certification + evidenceScore + documentationScore) / 5);
  const currentScore = overall;

  let trend: AuditReadinessScore["trend"] = "stable";
  if (previousScore != null) {
    if (currentScore > previousScore + 1) trend = "up";
    else if (currentScore < previousScore - 1) trend = "down";
  }

  return {
    overall,
    certification,
    operational,
    compliance,
    evidence: evidenceScore,
    documentation: documentationScore,
    currentScore,
    previousScore,
    trend,
    target: READINESS_TARGET_SCORE,
    lastEvaluation: new Date().toISOString(),
  };
}

export function runPreAuditSimulation(ctx: EnterpriseComplianceLiveContext, gapAnalysis: GapAnalysisItem[]): PreAuditSimulation {
  const audit = ctx.auditSnapshot;
  const criticalGaps = gapAnalysis.filter((g) => g.severity === "critical" || g.severity === "high");
  const missingControls = gapAnalysis.filter((g) => g.category === "control").map((g) => g.title);
  const missingEvidence = gapAnalysis.filter((g) => g.category === "evidence").map((g) => g.title);
  const missingDocumentation = gapAnalysis.filter((g) => g.category === "documentation").map((g) => g.title);
  const policyGaps = gapAnalysis.filter((g) => g.category === "policy").map((g) => g.title);
  const configurationGaps = gapAnalysis.filter((g) => g.category === "configuration").map((g) => g.title);

  const verifiedFindings = audit.findings
    .filter((f) => f.severity !== "passed")
    .map((f) => `[Verified] ${f.title}`)
    .slice(0, 8);

  const estimatedRisks = criticalGaps
    .filter((g) => g.source === "estimated")
    .map((g) => `[Estimated risk] ${g.title}`)
    .slice(0, 5);

  const aiRecommendations = [
    audit.scores.criticalIssues > 0 ? "[AI] Prioritize critical finding remediation before external audit" : "",
    missingEvidence.length > 0 ? "[AI] Assemble evidence packs for standards with missing documentation" : "",
    audit.scores.riskScore > 25 ? "[AI] Run OMEGA integrity verification and pre-audit again after fixes" : "",
  ].filter(Boolean);

  const baseReadiness = Math.max(
    35,
    Math.min(
      98,
      audit.scores.productionReadiness -
        criticalGaps.length * 3 -
        audit.scores.criticalIssues * 5 +
        (audit.runs[0]?.issuesResolved ?? 0),
    ),
  );

  const estimatedOutcome: PreAuditSimulation["estimatedOutcome"] =
    baseReadiness >= 90 ? "pass" : baseReadiness >= 75 ? "conditional" : "fail";

  return {
    id: `pre-audit-${Date.now().toString(36)}`,
    runAt: new Date().toISOString(),
    estimatedReadiness: baseReadiness,
    estimatedOutcome,
    verifiedFindings,
    estimatedRisks,
    aiRecommendations,
    missingControls,
    missingEvidence,
    missingDocumentation,
    policyGaps,
    configurationGaps,
    riskSummary: `${criticalGaps.length} high-priority gap(s). Risk score ${audit.scores.riskScore}. Estimated outcome: ${estimatedOutcome}.`,
    priorityActions: gapAnalysis.slice(0, 5).map((g) => g.title),
  };
}

export function buildGapAnalysis(ctx: EnterpriseComplianceLiveContext): GapAnalysisItem[] {
  const gaps: GapAnalysisItem[] = [];
  let idx = 0;

  for (const finding of ctx.auditSnapshot.findings.filter((f) => f.severity !== "passed")) {
    gaps.push({
      id: `gap-${idx++}`,
      category: finding.category === "compliance" ? "control" : finding.category === "security" ? "configuration" : "process",
      title: finding.title,
      severity: finding.severity === "blocking" || finding.severity === "critical" ? "critical" : finding.severity === "warning" ? "medium" : "low",
      source: "verified",
    });
  }

  for (const standard of ctx.auditSnapshot.compliance) {
    for (const missing of standard.missingEvidence) {
      gaps.push({
        id: `gap-${idx++}`,
        category: "evidence",
        title: missing,
        severity: standard.percentage < 75 ? "high" : "medium",
        standard: standard.label,
        source: "verified",
      });
    }
    if (standard.percentage < 85) {
      gaps.push({
        id: `gap-${idx++}`,
        category: "control",
        title: `${standard.label} controls below target (${standard.percentage}%)`,
        severity: standard.percentage < 70 ? "critical" : "high",
        standard: standard.label,
        source: "verified",
      });
    }
  }

  for (const policy of COMPLIANCE_POLICIES) {
    gaps.push({
      id: `gap-${idx++}`,
      category: "procedure",
      title: `Review procedure documentation for ${policy.label}`,
      severity: "low",
      source: "estimated",
    });
  }

  if (ctx.auditLogsError) {
    gaps.push({
      id: `gap-${idx++}`,
      category: "configuration",
      title: "Audit log synchronization issue detected",
      severity: "high",
      source: "verified",
    });
  }

  const unassigned = gaps.filter((g) => g.severity === "critical" || g.severity === "high").slice(0, 3);
  for (const gap of unassigned) {
    gaps.push({
      id: `gap-${idx++}`,
      category: "task",
      title: `Assign owner for: ${gap.title}`,
      severity: "medium",
      source: "estimated",
    });
  }

  return gaps.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });
}

export function buildRemediationItems(gaps: GapAnalysisItem[], overrides: Record<string, Partial<RemediationItem>> = {}): RemediationItem[] {
  const owners = ["Compliance Team", "Security Team", "Operations Team", "Recovery Team"];
  return gaps.slice(0, 20).map((gap, index) => {
    const priority = gap.severity === "critical" ? "critical" : gap.severity === "high" ? "high" : gap.severity === "medium" ? "medium" : "low";
    const base: RemediationItem = {
      id: `rem-${gap.id}`,
      title: gap.title,
      priority,
      owner: owners[index % owners.length]!,
      dueDate: daysFromNow(priority === "critical" ? 7 : priority === "high" ? 14 : 30),
      estimatedEffort: priority === "critical" ? "High" : priority === "high" ? "Medium" : "Low",
      estimatedRiskReduction: priority === "critical" ? 15 : priority === "high" ? 10 : 5,
      status: "open",
      completionPercent: 0,
      dependencies: index > 0 && priority === "critical" ? [`rem-gap-${gaps[index - 1]?.id}`] : [],
      gapId: gap.id,
    };
    return { ...base, ...overrides[base.id] };
  });
}

export function buildComplianceHistory(ctx: EnterpriseComplianceLiveContext, preAuditHistory: PreAuditSimulation[], exports: { label: string; generatedAt: string; generatedBy?: string }[]): ComplianceHistoryEntry[] {
  const entries: ComplianceHistoryEntry[] = [];

  for (const run of ctx.auditSnapshot.runs) {
    entries.push({
      id: run.id,
      type: "audit-run",
      label: `Enterprise audit — ${run.modulesScanned} modules`,
      timestamp: run.runAt,
      actor: run.administrator,
      outcome: run.certificationStatus,
    });
  }

  for (const sim of preAuditHistory) {
    entries.push({
      id: sim.id,
      type: "pre-audit",
      label: `Pre-audit simulation — ${sim.estimatedReadiness}% readiness`,
      timestamp: sim.runAt,
      actor: "System",
      outcome: sim.estimatedOutcome,
    });
  }

  for (const cert of ctx.certificationSnapshot.history.slice(0, 10)) {
    entries.push({
      id: cert.id,
      type: "certification",
      label: `${cert.level} v${cert.certificationVersion}`,
      timestamp: cert.createdAt,
      actor: cert.administrator,
      outcome: cert.level,
    });
  }

  for (const exp of exports.slice(0, 10)) {
    entries.push({
      id: `hist-${exp.generatedAt}`,
      type: "export",
      label: exp.label,
      timestamp: exp.generatedAt,
      actor: exp.generatedBy ?? "System",
      outcome: "exported",
    });
  }

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function buildOriAuditIntelligence(input: {
  ctx: EnterpriseComplianceLiveContext;
  readiness: AuditReadinessScore;
  gapAnalysis: GapAnalysisItem[];
  complianceTimeline: ComplianceTimelineRecord[];
}): OriAuditIntelligence {
  const { ctx, readiness, gapAnalysis, complianceTimeline } = input;
  const verifiedFindings = [
    `Overall audit readiness: ${readiness.currentScore}% (target ${readiness.target}%)`,
    `${ctx.auditSnapshot.findings.filter((f) => f.severity !== "passed").length} open finding(s) from live module scans`,
    `${gapAnalysis.filter((g) => g.source === "verified").length} verified gap(s) identified`,
  ];

  const predictiveAnalysis = [
    readiness.trend === "down" ? "[Predictive] Readiness trending down — external audit risk elevated" : "",
    readiness.currentScore < readiness.target ? `[Predictive] ${readiness.target - readiness.currentScore} point gap to certification target` : "",
    gapAnalysis.filter((g) => g.category === "evidence").length > 3 ? "[Predictive] Evidence collection may delay certification timeline" : "",
  ].filter(Boolean);

  const difficulty: OriAuditIntelligence["estimatedAuditDifficulty"] =
    readiness.currentScore >= 90 ? "low" : readiness.currentScore >= 80 ? "moderate" : readiness.currentScore >= 65 ? "high" : "critical";

  return {
    executiveSummary: `Platform audit readiness is ${readiness.currentScore}%. ${complianceTimeline.length} standards tracked. ${gapAnalysis.length} gap(s) require attention before external certification.`,
    topRisks: ctx.auditSnapshot.findings.filter((f) => f.severity === "critical" || f.severity === "blocking").map((f) => f.title).slice(0, 5),
    priorityRecommendations: gapAnalysis.slice(0, 5).map((g) => g.title),
    missingEvidence: gapAnalysis.filter((g) => g.category === "evidence").map((g) => g.title),
    missingControls: gapAnalysis.filter((g) => g.category === "control").map((g) => g.title),
    trendAnalysis: readiness.trend === "up" ? "Readiness improving vs previous evaluation" : readiness.trend === "down" ? "Readiness declining — remediate priority gaps" : "Readiness stable",
    readinessForecast: readiness.currentScore >= readiness.target ? "On track for certification target" : `Estimated ${Math.min(readiness.currentScore + 8, readiness.target)}% within 30 days with active remediation`,
    estimatedAuditDifficulty: difficulty,
    verifiedFindings,
    predictiveAnalysis,
    confidence: ctx.auditSnapshot.modules.length >= 10 ? "high" : ctx.auditSnapshot.modules.length >= 5 ? "medium" : "low",
  };
}

export function validateAuditReadinessReadiness(snapshot: {
  readiness: AuditReadinessScore;
  gapAnalysis: GapAnalysisItem[];
  preAudit: PreAuditSimulation | null;
}): { ready: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (snapshot.readiness.currentScore < 50) blockers.push("Overall readiness below minimum threshold");
  if (snapshot.gapAnalysis.filter((g) => g.severity === "critical").length > 5) blockers.push("Too many critical gaps for certification");
  return { ready: blockers.length === 0, blockers };
}
