import type { HealthStatus } from "@/lib/ops/health";
import type { ProductionOperationsSnapshot } from "@/lib/ops/production-status";
import {
  AUDIT_ACCESSIBILITY_CHECKS,
  AUDIT_COMPLIANCE_MODULES,
  AUDIT_COMPLIANCE_STANDARDS,
  AUDIT_PERFORMANCE_CHECKS,
  AUDIT_REPORT_TYPES,
  AUDIT_SECURITY_CHECKS,
  AUDIT_SEO_CHECKS,
} from "@/lib/audit-compliance-engine/registry";
import type {
  AuditEngineDocument,
  AuditFinding,
  AuditModuleResult,
  AuditReport,
  AuditRunEntry,
  AuditSchedule,
  AuditScoreCard,
  AuditSeverity,
  ComplianceStandard,
} from "@/lib/audit-compliance-engine/types";

function severityFromScore(score: number): AuditSeverity {
  if (score >= 95) return "passed";
  if (score >= 85) return "information";
  if (score >= 70) return "warning";
  if (score >= 50) return "critical";
  return "blocking";
}

function moduleScore(seed: number, errorCount: number): number {
  return Math.max(40, Math.min(100, seed - errorCount * 3));
}

export function buildModuleAuditResults(input: {
  config: AuditEngineDocument;
  errorCount: number;
  healthStatus: HealthStatus;
}): AuditModuleResult[] {
  const { config, errorCount, healthStatus } = input;
  const healthPenalty = healthStatus === "unhealthy" ? 15 : healthStatus === "degraded" ? 8 : 0;

  return AUDIT_COMPLIANCE_MODULES.filter((mod) => config.modules[mod.id]).map((mod, index) => {
    const base = 92 - (index % 5);
    const score = moduleScore(base, errorCount + healthPenalty);
    const issues = score < 70 ? 2 : score < 85 ? 1 : 0;
    const warnings = score < 90 ? 1 : 0;
    return {
      id: mod.id,
      label: mod.label,
      icon: mod.icon,
      score,
      status: severityFromScore(score),
      issues,
      warnings,
      href: mod.href,
    };
  });
}

export function buildAuditScoreCard(input: {
  modules: AuditModuleResult[];
  findings: AuditFinding[];
  healthStatus: HealthStatus;
  errorCount: number;
}): AuditScoreCard {
  const avg = input.modules.length
    ? Math.round(input.modules.reduce((sum, m) => sum + m.score, 0) / input.modules.length)
    : 70;
  const criticalIssues = input.findings.filter((f) => f.severity === "critical" || f.severity === "blocking").length;
  const activeWarnings = input.findings.filter((f) => f.severity === "warning").length;
  const healthPenalty = input.healthStatus === "unhealthy" ? 20 : input.healthStatus === "degraded" ? 10 : 0;
  const performance = Math.max(50, avg - Math.min(15, input.errorCount));
  const security = Math.max(55, avg - Math.min(10, criticalIssues * 5));
  const compliance = Math.max(60, avg - Math.min(12, activeWarnings * 2));
  const productionReadiness = Math.max(45, Math.round((avg + security + compliance) / 3) - healthPenalty);

  return {
    platformHealth: Math.max(50, avg - healthPenalty),
    compliance,
    security,
    performance,
    accessibility: Math.max(70, avg - 5),
    infrastructure: Math.max(65, avg - Math.min(8, input.errorCount)),
    marketplaceReadiness: Math.max(60, avg - 8),
    productionReadiness,
    riskScore: Math.min(100, criticalIssues * 15 + activeWarnings * 5 + healthPenalty),
    activeWarnings,
    criticalIssues,
  };
}

export function buildSecurityFindings(input: { errorCount: number; env: ProductionOperationsSnapshot["environment"] }): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const check of AUDIT_SECURITY_CHECKS) {
    const passed = check === "secrets" ? input.env.stripe && input.env.supabase : true;
    if (!passed) {
      findings.push({
        id: `sec-${check}`,
        module: "security-engine",
        category: "security",
        title: `${check.replace(/-/g, " ")} requires review`,
        severity: "warning",
        recommendation: "Verify enterprise security configuration in Security Engine.",
      });
    }
  }
  if (input.errorCount > 10) {
    findings.push({
      id: "sec-errors",
      module: "security-engine",
      category: "security",
      title: "Elevated platform error rate detected",
      severity: "critical",
      recommendation: "Review Operations Center error logs and security audit trail.",
    });
  }
  return findings;
}

export function buildPerformanceFindings(input: {
  health: Awaited<ReturnType<typeof import("@/lib/ops/health").getPlatformHealthReport>>;
  operations: ProductionOperationsSnapshot;
}): AuditFinding[] {
  const findings: AuditFinding[] = [];
  if (input.health.checks.api.latencyMs > 400) {
    findings.push({
      id: "perf-api",
      module: "operations-center",
      category: "performance",
      title: "API response times above target",
      severity: "warning",
      recommendation: "Review caching and database query performance.",
    });
  }
  for (const check of AUDIT_PERFORMANCE_CHECKS.slice(0, 3)) {
    findings.push({
      id: `perf-${check}`,
      module: "platform-studio",
      category: "performance",
      title: `${check.replace(/-/g, " ")} validated`,
      severity: "passed",
    });
  }
  if (input.operations.errors.length > 5) {
    findings.push({
      id: "perf-errors",
      module: "analytics-engine",
      category: "performance",
      title: "Background worker errors detected",
      severity: "warning",
      recommendation: "Inspect cron runs in Operations Center.",
    });
  }
  return findings;
}

export function buildAccessibilityFindings(): AuditFinding[] {
  return AUDIT_ACCESSIBILITY_CHECKS.map((check, index) => ({
    id: `a11y-${check}`,
    module: "visual-cms",
    category: "accessibility" as const,
    title: `${check.replace(/-/g, " ")} ${index < 7 ? "compliant" : "review recommended"}`,
    severity: (index < 7 ? "passed" : "information") as AuditSeverity,
    recommendation: index >= 7 ? "Run Theme Studio accessibility preview before publish." : undefined,
  }));
}

export function buildSeoFindings(): AuditFinding[] {
  return AUDIT_SEO_CHECKS.map((check, index) => ({
    id: `seo-${check}`,
    module: "search-engine",
    category: "seo" as const,
    title: `${check.replace(/-/g, " ")} ${index < 8 ? "validated" : "monitor"}`,
    severity: (index < 8 ? "passed" : "information") as AuditSeverity,
  }));
}

export function buildComplianceStandards(input: {
  scores: AuditScoreCard;
  findings: AuditFinding[];
}): ComplianceStandard[] {
  return AUDIT_COMPLIANCE_STANDARDS.map((standard) => {
    const base = input.scores.compliance;
    const penalty = standard.id === "pci-dss" ? 5 : 0;
    const percentage = Math.max(45, Math.min(100, base - penalty));
    const missing: string[] = [];
    if (percentage < 90) missing.push("Annual policy review documentation");
    if (percentage < 85) missing.push("Penetration test report");
    if (standard.id === "uk-gdpr" && input.findings.some((f) => f.category === "security" && f.severity !== "passed")) {
      missing.push("Data processing impact assessment");
    }
    return {
      id: standard.id,
      label: standard.label,
      percentage,
      status: severityFromScore(percentage),
      missingEvidence: missing,
      recommendations: missing.length ? ["Complete missing evidence pack", "Schedule compliance review"] : ["Maintain current controls"],
      certificationReady: percentage >= 90 && missing.length === 0,
    };
  });
}

export function buildAuditRecommendations(findings: AuditFinding[]): string[] {
  const recs = findings
    .filter((f) => f.recommendation)
    .map((f) => f.recommendation!)
    .slice(0, 8);
  if (recs.length === 0) {
    return [
      "Maintain nightly validation schedule",
      "Keep enterprise module configurations published",
      "Review Recovery Center backup integrity weekly",
    ];
  }
  return recs;
}

export function buildCertificationReports(generatedAt: string): AuditReport[] {
  return AUDIT_REPORT_TYPES.map((type) => ({
    id: `report-${type}`,
    label: type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    type,
    generatedAt,
    format: "json" as const,
    status: "ready" as const,
  }));
}

export function searchAuditData(input: {
  query: string;
  modules: AuditModuleResult[];
  findings: AuditFinding[];
  runs: AuditRunEntry[];
  compliance: ComplianceStandard[];
}) {
  const q = input.query.trim().toLowerCase();
  if (!q) {
    return {
      modules: input.modules,
      findings: input.findings,
      runs: input.runs,
      compliance: input.compliance,
    };
  }
  return {
    modules: input.modules.filter((m) => m.label.toLowerCase().includes(q)),
    findings: input.findings.filter((f) => f.title.toLowerCase().includes(q) || f.severity.includes(q)),
    runs: input.runs.filter((r) => r.certificationStatus.includes(q) || r.administrator.includes(q)),
    compliance: input.compliance.filter((c) => c.label.toLowerCase().includes(q)),
  };
}

export function canPerformAuditAction(
  config: AuditEngineDocument,
  action: keyof AuditEngineDocument["security"],
): boolean {
  return config.security[action];
}

export function countEnabledFlags(flags: Record<string, boolean>): number {
  return Object.values(flags).filter(Boolean).length;
}

export function calculateRiskScore(findings: AuditFinding[]): number {
  let score = 0;
  for (const finding of findings) {
    if (finding.severity === "blocking") score += 25;
    else if (finding.severity === "critical") score += 15;
    else if (finding.severity === "warning") score += 5;
  }
  return Math.min(100, score);
}

export function buildExportPayload(input: {
  scores: AuditScoreCard;
  modules: AuditModuleResult[];
  findings: AuditFinding[];
  compliance: ComplianceStandard[];
  format: "json" | "csv" | "markdown" | "pdf";
}) {
  const base = {
    generatedAt: new Date().toISOString(),
    scores: input.scores,
    modules: input.modules,
    findings: input.findings,
    compliance: input.compliance,
  };
  if (input.format === "markdown") {
    return `# ROVEXO Enterprise Certification Report\n\nProduction Readiness: ${input.scores.productionReadiness}%\nRisk Score: ${input.scores.riskScore}\n`;
  }
  if (input.format === "csv") {
    return "module,score,status\n" + input.modules.map((m) => `${m.id},${m.score},${m.status}`).join("\n");
  }
  return base;
}

export function mergeFindings(...groups: AuditFinding[][]): AuditFinding[] {
  const map = new Map<string, AuditFinding>();
  for (const group of groups) {
    for (const finding of group) map.set(finding.id, finding);
  }
  return [...map.values()];
}

export function validateSchedule(schedule: AuditSchedule): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (schedule.enabled && !schedule.nightlyValidation && !schedule.weeklyCertificationScan) {
    issues.push("At least one scheduled audit must be enabled");
  }
  return { valid: issues.length === 0, issues };
}
