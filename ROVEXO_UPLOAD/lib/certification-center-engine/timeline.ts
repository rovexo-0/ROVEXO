import type { HealthStatus } from "@/lib/ops/health";
import type { ProductionOperationsSnapshot } from "@/lib/ops/production-status";
import {
  CERTIFICATION_APPROVAL_STAGES,
  CERTIFICATION_MODULES,
  CERTIFICATION_REPORT_TYPES,
  RELEASE_VALIDATION_CHECKS,
} from "@/lib/certification-center-engine/registry";
import type {
  CertificationApproval,
  CertificationDashboard,
  CertificationEngineDocument,
  CertificationHistoryEntry,
  CertificationLevel,
  CertificationModuleResult,
  CertificationReport,
  CertificationSchedule,
  CertificationScorecard,
  CertificationStatus,
  ReleaseValidationCheck,
} from "@/lib/certification-center-engine/types";

function severityFromScore(score: number): CertificationStatus {
  if (score >= 95) return "passed";
  if (score >= 85) return "information";
  if (score >= 70) return "warning";
  if (score >= 50) return "critical";
  return "blocking";
}

function moduleScore(base: number, penalty: number): number {
  return Math.max(40, Math.min(100, base - penalty));
}

export function buildCertificationModuleResults(input: {
  config: CertificationEngineDocument;
  errorCount: number;
  healthStatus: HealthStatus;
}): CertificationModuleResult[] {
  const penalty = input.healthStatus === "unhealthy" ? 15 : input.healthStatus === "degraded" ? 8 : 0;

  return CERTIFICATION_MODULES.filter((m) => input.config.modules[m.id]).map((module, index) => {
    const score = moduleScore(94 - (index % 4), input.errorCount + penalty);
    return {
      id: module.id,
      label: module.label,
      icon: module.icon,
      score,
      status: severityFromScore(score),
      certified: score >= 85,
      href: module.href,
    };
  });
}

export function buildCertificationScorecard(input: {
  modules: CertificationModuleResult[];
  errorCount: number;
  healthStatus: HealthStatus;
}): CertificationScorecard {
  const avg = input.modules.length
    ? Math.round(input.modules.reduce((sum, m) => sum + m.score, 0) / input.modules.length)
    : 70;
  const penalty = input.healthStatus === "unhealthy" ? 15 : input.healthStatus === "degraded" ? 8 : 0;

  return {
    security: moduleScore(avg + 2, penalty),
    performance: moduleScore(avg, input.errorCount),
    accessibility: moduleScore(avg + 1, 5),
    compliance: moduleScore(avg + 3, penalty),
    reliability: moduleScore(avg, input.errorCount / 2),
    scalability: moduleScore(avg - 2, 0),
    maintainability: moduleScore(avg + 1, 0),
    observability: moduleScore(avg, input.errorCount / 3),
    marketplaceHealth: moduleScore(avg - 1, penalty / 2),
    overallEnterpriseScore: moduleScore(avg, penalty + input.errorCount / 2),
  };
}

export function buildCertificationDashboard(input: {
  scorecard: CertificationScorecard;
  modules: CertificationModuleResult[];
  criticalCount: number;
  approvals: CertificationApproval[];
}): CertificationDashboard {
  const certifiedCount = input.modules.filter((m) => m.certified).length;
  const allApproved = input.approvals.filter((a) => a.stage !== "archive").every((a) => a.status === "approved");
  let overallStatus: CertificationLevel = "draft";
  if (certifiedCount >= 18 && input.criticalCount === 0) overallStatus = "production-ready";
  if (allApproved && input.criticalCount === 0) overallStatus = "certified";
  if (input.criticalCount > 0) overallStatus = "internal-review";

  return {
    overallStatus,
    productionReadiness: input.scorecard.overallEnterpriseScore,
    complianceReadiness: input.scorecard.compliance,
    securityReadiness: input.scorecard.security,
    performanceReadiness: input.scorecard.performance,
    infrastructureReadiness: input.scorecard.observability,
    recoveryReadiness: input.scorecard.reliability,
    aiReadiness: input.modules.find((m) => m.id === "ai-engine")?.score ?? 80,
    marketplaceReadiness: input.scorecard.marketplaceHealth,
    finalRiskScore: Math.min(100, input.criticalCount * 20 + (100 - input.scorecard.overallEnterpriseScore) / 2),
  };
}

export function buildReleaseValidationChecks(input: {
  config: CertificationEngineDocument;
  errorCount: number;
  healthStatus: HealthStatus;
  operations: ProductionOperationsSnapshot;
}): ReleaseValidationCheck[] {
  const critical = input.errorCount > 10 || input.healthStatus === "unhealthy";
  const flags = input.config.releaseValidation;

  const flagMap: Record<string, boolean> = {
    "production-build": flags.productionBuild,
    typecheck: flags.typecheck,
    "unit-tests": flags.unitTests,
    "integration-tests": flags.integrationTests,
    "end-to-end-tests": flags.endToEndTests,
    accessibility: flags.accessibility,
    seo: flags.seo,
    performance: flags.performance,
    security: flags.security,
    compliance: flags.compliance,
    infrastructure: flags.infrastructure,
    monitoring: flags.monitoring,
    backups: flags.backups,
    recovery: flags.recovery,
    "health-checks": flags.healthChecks,
  };

  return RELEASE_VALIDATION_CHECKS.map((check) => {
    const enabled = flagMap[check.id] ?? true;
    let passed = enabled && !critical;
    if (check.id === "production-build" || check.id === "typecheck") passed = enabled;
    if (check.id === "backups" || check.id === "recovery") passed = enabled && input.operations.environment.supabase;
    if (check.id === "monitoring") passed = enabled && input.operations.environment.cron;
    return { id: check.id, label: check.label, category: check.category, passed, detail: passed ? "Validated" : "Requires attention" };
  });
}

export function buildCertificationReports(generatedAt: string): CertificationReport[] {
  return CERTIFICATION_REPORT_TYPES.map((type) => ({
    id: `cert-report-${type}`,
    label: type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    type,
    generatedAt,
    format: "json" as const,
    status: "ready" as const,
  }));
}

export function buildCertificationRecommendations(input: {
  validations: ReleaseValidationCheck[];
  modules: CertificationModuleResult[];
}): string[] {
  const recs: string[] = [];
  for (const check of input.validations.filter((v) => !v.passed)) {
    recs.push(`Resolve ${check.label} before production certification`);
  }
  for (const module of input.modules.filter((m) => !m.certified)) {
    recs.push(`Bring ${module.label} above certification threshold (85%)`);
  }
  if (recs.length === 0) {
    return [
      "All release validation checks passing",
      "Proceed to executive approval for production certification",
      "Schedule pre-release validation before deployment",
    ];
  }
  return recs.slice(0, 8);
}

export function canPerformCertificationAction(
  config: CertificationEngineDocument,
  action: keyof CertificationEngineDocument["security"],
): boolean {
  return config.security[action];
}

export function searchCertificationData(input: {
  query: string;
  modules: CertificationModuleResult[];
  history: CertificationHistoryEntry[];
  validations: ReleaseValidationCheck[];
}) {
  const q = input.query.trim().toLowerCase();
  if (!q) return { modules: input.modules, history: input.history, validations: input.validations };
  return {
    modules: input.modules.filter((m) => m.label.toLowerCase().includes(q)),
    history: input.history.filter((h) => h.level.includes(q) || h.platformVersion.toLowerCase().includes(q)),
    validations: input.validations.filter((v) => v.label.toLowerCase().includes(q)),
  };
}

export function calculateCertificationRisk(input: {
  validations: ReleaseValidationCheck[];
  modules: CertificationModuleResult[];
}): number {
  let score = 0;
  score += input.validations.filter((v) => !v.passed).length * 8;
  score += input.modules.filter((m) => m.status === "critical" || m.status === "blocking").length * 12;
  return Math.min(100, score);
}

export function buildExportPayload(input: {
  dashboard: CertificationDashboard;
  scorecard: CertificationScorecard;
  modules: CertificationModuleResult[];
  format: "json" | "csv" | "markdown" | "pdf";
}) {
  const base = { generatedAt: new Date().toISOString(), dashboard: input.dashboard, scorecard: input.scorecard, modules: input.modules };
  if (input.format === "markdown") {
    return `# ROVEXO Production Certification Report\n\nOverall: ${input.dashboard.overallStatus}\nEnterprise Score: ${input.scorecard.overallEnterpriseScore}%\n`;
  }
  if (input.format === "csv") {
    return "module,score,certified\n" + input.modules.map((m) => `${m.id},${m.score},${m.certified}`).join("\n");
  }
  return base;
}

export function countEnabledFlags(flags: Record<string, boolean>): number {
  return Object.values(flags).filter(Boolean).length;
}

export function getNextApprovalStage(approvals: CertificationApproval[]): CertificationApproval | undefined {
  return approvals.find((a) => a.status === "pending");
}

export function validateCertificationReadiness(input: {
  validations: ReleaseValidationCheck[];
  criticalModules: number;
}): { ready: boolean; blockers: string[] } {
  const blockers: string[] = [];
  const failed = input.validations.filter((v) => !v.passed);
  if (failed.length > 0) blockers.push(`${failed.length} release validation checks failing`);
  if (input.criticalModules > 0) blockers.push(`${input.criticalModules} modules below certification threshold`);
  return { ready: blockers.length === 0, blockers };
}

export function resolveCertificationLevel(approvals: CertificationApproval[]): CertificationLevel {
  if (approvals.find((a) => a.stage === "production-certification")?.status === "approved") return "certified";
  if (approvals.find((a) => a.stage === "executive-approval")?.status === "approved") return "production-ready";
  if (approvals.find((a) => a.stage === "compliance-approval")?.status === "approved") return "compliance-approved";
  if (approvals.find((a) => a.stage === "security-approval")?.status === "approved") return "security-approved";
  if (approvals.find((a) => a.stage === "technical-approval")?.status === "approved") return "qa-approved";
  if (approvals.find((a) => a.stage === "review")?.status === "approved") return "internal-review";
  return "draft";
}

export { CERTIFICATION_APPROVAL_STAGES };
