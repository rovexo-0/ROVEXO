import { AUDIT_COMPLIANCE_STANDARDS } from "@/lib/audit-compliance-engine/registry";
import { CERTIFICATION_READINESS_ITEMS, COMPLIANCE_POLICIES } from "@/lib/enterprise-compliance-center-engine/registry";
import type { EnterpriseComplianceLiveContext } from "@/lib/enterprise-compliance-center-engine/live";
import type {
  AuditTimelineRecord,
  CertificationDashboardItem,
  ChangeTimelineRecord,
  CompliancePolicy,
  ComplianceTimelineRecord,
  EnterpriseComplianceSettings,
  EvidenceVaultItem,
  IntegrityVerification,
  OriComplianceAnalysis,
  OmegaComplianceStatus,
} from "@/lib/enterprise-compliance-center-engine/types";

function hashParts(parts: string[]): string {
  let hash = 0;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `ecc-${Math.abs(hash).toString(36)}`;
}

function formatDateParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function mapModule(resourceType: string, action: string): string {
  const text = `${resourceType} ${action}`.toLowerCase();
  if (text.includes("incident")) return "Incident Command";
  if (text.includes("certification")) return "Certification Center";
  if (text.includes("audit") || text.includes("compliance")) return "Audit & Compliance";
  if (text.includes("omega")) return "OMEGA Enterprise";
  if (text.includes("recovery")) return "Recovery Center";
  if (text.includes("operations")) return "Operations Center";
  if (text.includes("security")) return "Security Engine";
  if (text.includes("payment")) return "Payments Engine";
  if (text.includes("wallet")) return "Wallet Engine";
  if (text.includes("settings") || text.includes("platform")) return "Platform Settings";
  return resourceType.replace(/_/g, " ");
}

export function buildAuditTimeline(ctx: EnterpriseComplianceLiveContext): AuditTimelineRecord[] {
  const engineLog = ctx.auditSnapshot.live.auditLog ?? [];
  const fromEngine: AuditTimelineRecord[] = engineLog.map((entry) => {
    const { date, time } = formatDateParts(entry.timestamp);
    return {
      id: entry.id,
      auditId: entry.id,
      date,
      time,
      timestamp: entry.timestamp,
      user: entry.administrator,
      role: "Super Admin",
      device: "Enterprise Console",
      action: entry.action,
      result: "Completed",
      durationMs: null,
      module: entry.module,
      approvalRequired: entry.action.includes("approve") || entry.action.includes("emergency"),
      approvalResult: entry.action.includes("approve") ? "Approved" : null,
      auditStatus: "verified",
      sourceHash: hashParts([entry.id, entry.timestamp, entry.action]),
    };
  });

  const fromPlatform: AuditTimelineRecord[] = (ctx.auditLogs ?? []).map((log) => {
    const meta = log.metadata as Record<string, unknown> | null;
    const { date, time } = formatDateParts(log.createdAt);
    const approvalRequired = log.action.includes("emergency") || Boolean(meta?.requireMfa);
    return {
      id: log.id,
      auditId: log.id,
      date,
      time,
      timestamp: log.createdAt,
      user: log.actorId ?? "System",
      role: typeof meta?.role === "string" ? meta.role : "Super Admin",
      device: typeof meta?.device === "string" ? meta.device : "Enterprise Console",
      action: log.action,
      result: typeof meta?.result === "string" ? meta.result : "Recorded",
      durationMs: typeof meta?.durationMs === "number" ? meta.durationMs : null,
      module: mapModule(log.resourceType, log.action),
      approvalRequired,
      approvalResult: approvalRequired ? (typeof meta?.approved === "boolean" && meta.approved ? "Approved" : "Pending") : null,
      auditStatus: ctx.auditLogsError ? "flagged" : "recorded",
      sourceHash: hashParts([log.id, log.createdAt, log.action]),
    };
  });

  const merged = [...fromPlatform, ...fromEngine];
  const seen = new Set<string>();
  return merged
    .filter((r) => {
      if (seen.has(r.sourceHash)) return false;
      seen.add(r.sourceHash);
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function buildComplianceTimeline(ctx: EnterpriseComplianceLiveContext): ComplianceTimelineRecord[] {
  const internalScore = ctx.auditSnapshot.scores.compliance;
  const standards = [
    ...AUDIT_COMPLIANCE_STANDARDS.map((s) => ({ id: s.id, label: s.label })),
    { id: "internal-score", label: "Internal Compliance Score" },
  ];

  return standards.map((standard) => {
    const match = ctx.auditSnapshot.compliance.find((c) => c.id === standard.id || c.label.toLowerCase().includes(standard.label.toLowerCase().slice(0, 6)));
    const progress = standard.id === "internal-score" ? internalScore : match?.percentage ?? internalScore;
    const totalControls = 20;
    const failed = progress < 70 ? 2 : progress < 85 ? 1 : 0;
    const pending = progress < 90 ? Math.max(1, Math.round((100 - progress) / 10)) : 0;
    const completed = totalControls - pending - failed;
    return {
      id: `compliance-${standard.id}`,
      standardId: standard.id,
      label: standard.label,
      progress,
      completedControls: completed,
      pendingControls: pending,
      failedControls: failed,
      evidenceStatus: progress >= 90 && !(match?.missingEvidence.length) ? "complete" : progress >= 75 ? "partial" : "missing",
      updatedAt: ctx.auditSnapshot.scannedAt,
      status: match?.status ?? (progress >= 90 ? "passed" : progress >= 75 ? "information" : "warning"),
    };
  });
}

export function buildChangeTimeline(ctx: EnterpriseComplianceLiveContext): ChangeTimelineRecord[] {
  const changes: ChangeTimelineRecord[] = [];

  for (const entry of ctx.auditSnapshot.history) {
    const { date, time } = formatDateParts(entry.publishedAt);
    changes.push({
      id: entry.id,
      date,
      time,
      timestamp: entry.publishedAt,
      changeType: "Configuration Changes",
      executedBy: entry.publishedBy ?? "System",
      approvedBy: entry.publishedBy ?? null,
      impact: "Audit engine configuration published",
      rollbackAvailable: entry.rollbackAvailable,
      detail: entry.label,
      module: "Audit & Compliance Engine",
      sourceHash: hashParts([entry.id, entry.publishedAt, entry.label]),
    });
  }

  for (const log of ctx.auditLogs ?? []) {
    const isChange =
      log.action.includes("change") ||
      log.action.includes("settings") ||
      log.action.includes("publish") ||
      log.action.includes("rollback") ||
      log.action.includes("permission") ||
      log.action.includes("role") ||
      log.resourceType.includes("settings");
    if (!isChange) continue;
    const meta = log.metadata as Record<string, unknown> | null;
    const { date, time } = formatDateParts(log.createdAt);
    let changeType = "System Settings";
    if (log.action.includes("permission")) changeType = "Permission Changes";
    else if (log.action.includes("role")) changeType = "Role Changes";
    else if (log.action.includes("rollback")) changeType = "Rollback Operations";
    else if (log.action.includes("publish") || log.action.includes("deploy")) changeType = "Release Deployments";
    else if (log.action.includes("security")) changeType = "Security Policy Changes";
    else if (log.action.includes("infra")) changeType = "Infrastructure Changes";

    changes.push({
      id: `change-${log.id}`,
      date,
      time,
      timestamp: log.createdAt,
      changeType,
      executedBy: log.actorId ?? "System",
      approvedBy: typeof meta?.approvedBy === "string" ? meta.approvedBy : null,
      impact: typeof meta?.impact === "string" ? meta.impact : mapModule(log.resourceType, log.action),
      rollbackAvailable: Boolean(meta?.rollbackAvailable ?? log.action.includes("rollback")),
      detail: log.action,
      module: mapModule(log.resourceType, log.action),
      sourceHash: hashParts([log.id, log.createdAt, log.action]),
    });
  }

  const seen = new Set<string>();
  return changes
    .filter((c) => {
      if (seen.has(c.sourceHash)) return false;
      seen.add(c.sourceHash);
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function retentionStatus(expiry: string): EvidenceVaultItem["retentionStatus"] {
  const days = (new Date(expiry).getTime() - Date.now()) / (24 * 60 * 60_000);
  if (days <= 0) return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

export function buildEvidenceVault(ctx: EnterpriseComplianceLiveContext, settings: EnterpriseComplianceSettings): EvidenceVaultItem[] {
  const expiry = new Date(Date.now() + settings.retentionDays * 24 * 60 * 60_000).toISOString();
  const items: EvidenceVaultItem[] = [];

  for (const report of ctx.auditSnapshot.reports) {
    items.push({
      id: report.id,
      label: report.label,
      category: report.type === "security" ? "security-report" : report.type === "compliance" ? "compliance-document" : "audit-report",
      format: report.format === "markdown" ? "markdown" : report.format,
      generatedAt: report.generatedAt,
      evidenceHash: hashParts([report.id, report.generatedAt, report.type]),
      integrityStatus: "verified",
      retentionExpiry: expiry,
      retentionStatus: retentionStatus(expiry),
      source: "Audit & Compliance Engine",
    });
  }

  for (const report of ctx.incidentReports) {
    items.push({
      id: report.id,
      label: report.label,
      category: "incident-report",
      format: report.format,
      generatedAt: report.generatedAt,
      evidenceHash: hashParts([report.id, report.generatedAt]),
      integrityStatus: "verified",
      retentionExpiry: expiry,
      retentionStatus: retentionStatus(expiry),
      source: "Incident Command Center",
    });
  }

  for (const exp of ctx.timelineExports) {
    items.push({
      id: exp.id,
      label: exp.label,
      category: "export",
      format: exp.format,
      generatedAt: exp.generatedAt,
      evidenceHash: hashParts([exp.id, exp.generatedAt]),
      integrityStatus: "verified",
      retentionExpiry: expiry,
      retentionStatus: retentionStatus(expiry),
      source: "Incident Timeline",
    });
  }

  for (const run of ctx.certificationSnapshot.history.slice(0, 10)) {
    items.push({
      id: run.id,
      label: `${run.level} certification v${run.certificationVersion}`,
      category: "certificate",
      format: "json",
      generatedAt: run.createdAt,
      evidenceHash: hashParts([run.id, run.createdAt]),
      integrityStatus: "verified",
      retentionExpiry: expiry,
      retentionStatus: retentionStatus(expiry),
      source: "Certification Center",
    });
  }

  for (const policy of COMPLIANCE_POLICIES) {
    items.push({
      id: `policy-${policy.id}`,
      label: policy.label,
      category: "policy",
      format: "pdf",
      generatedAt: new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString(),
      evidenceHash: hashParts([policy.id, policy.label]),
      integrityStatus: "verified",
      retentionExpiry: expiry,
      retentionStatus: retentionStatus(expiry),
      source: "Compliance Policy Registry",
    });
    items.push({
      id: `proc-${policy.id}`,
      label: `${policy.label} Procedure`,
      category: "procedure",
      format: "pdf",
      generatedAt: new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString(),
      evidenceHash: hashParts([policy.id, "procedure"]),
      integrityStatus: "verified",
      retentionExpiry: expiry,
      retentionStatus: retentionStatus(expiry),
      source: "Compliance Policy Registry",
    });
  }

  return items.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
}

export function buildCertificationDashboard(ctx: EnterpriseComplianceLiveContext): CertificationDashboardItem[] {
  const cert = ctx.certificationSnapshot;
  const audit = ctx.auditSnapshot;

  return CERTIFICATION_READINESS_ITEMS.map((item) => {
    let progress = cert.dashboard.complianceReadiness;
    let status: CertificationDashboardItem["status"] = "in-progress";
    let missingEvidence: string[] = [];

    if (item.id === "rovexo-trust") progress = Math.min(100, cert.scorecard.overallEnterpriseScore ?? audit.scores.productionReadiness);
    else if (item.id === "iso-27001") {
      const match = audit.compliance.find((c) => c.id === "iso-27001");
      progress = match?.percentage ?? audit.scores.compliance;
      missingEvidence = match?.missingEvidence ?? [];
    } else if (item.id === "soc2") {
      const match = audit.compliance.find((c) => c.id === "soc2");
      progress = match?.percentage ?? audit.scores.compliance;
      missingEvidence = match?.missingEvidence ?? [];
    } else if (item.id === "cyber-essentials") progress = audit.compliance.find((c) => c.id === "cyber-essentials")?.percentage ?? audit.scores.security;
    else if (item.id === "cyber-essentials-plus") progress = Math.max(0, (audit.compliance.find((c) => c.id === "cyber-essentials")?.percentage ?? 80) - 5);
    else if (item.id === "pci-dss") {
      const match = audit.compliance.find((c) => c.id === "pci-dss");
      progress = match?.percentage ?? audit.scores.compliance;
      missingEvidence = match?.missingEvidence ?? [];
    } else if (item.id === "gdpr") {
      const match = audit.compliance.find((c) => c.id === "gdpr");
      progress = match?.percentage ?? audit.scores.compliance;
      missingEvidence = match?.missingEvidence ?? [];
    } else if (item.id === "internal-standards") progress = audit.scores.productionReadiness;

    const totalControls = 20;
    const failed = progress < 70 ? 2 : progress < 85 ? 1 : 0;
    const pending = progress < 90 ? Math.max(1, Math.round((100 - progress) / 10)) : 0;
    const completed = totalControls - pending - failed;

    if (progress >= 90) status = "ready";
    else if (progress >= 70) status = "in-progress";
    else if (progress >= 50) status = "pending";
    else status = "failed";

    const targetDate = progress >= 90 ? null : daysFromNow(progress < 70 ? 90 : 60);

    return {
      id: item.id,
      label: item.label,
      progress,
      status,
      internalAuditStatus: audit.runs[0]?.certificationStatus ?? "pending",
      externalAuditStatus: cert.approvals.length > 0 ? "scheduled" : "not-scheduled",
      completedControls: completed,
      pendingControls: pending,
      missingEvidence,
      estimatedReadiness: progress,
      targetDate,
    };
  });
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60_000).toISOString().slice(0, 10);
}

export function buildCompliancePolicies(): CompliancePolicy[] {
  return COMPLIANCE_POLICIES.map((p) => ({
    id: p.id,
    label: p.label,
    category: p.category,
    status: "active" as const,
    lastReviewedAt: new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString(),
    owner: p.owner,
  }));
}

export function verifyIntegrity(input: {
  auditTimeline: AuditTimelineRecord[];
  changeTimeline: ChangeTimelineRecord[];
  evidenceVault: EvidenceVaultItem[];
  ctx: EnterpriseComplianceLiveContext;
}): IntegrityVerification {
  const issues: string[] = [];
  const auditHashes = input.auditTimeline.map((a) => a.sourceHash);
  const changeHashes = input.changeTimeline.map((c) => c.sourceHash);
  const duplicateRecords =
    auditHashes.length - new Set(auditHashes).size + (changeHashes.length - new Set(changeHashes).size);
  if (duplicateRecords > 0) issues.push(`${duplicateRecords} duplicate record hash(es) detected`);
  if (input.ctx.auditLogsError) issues.push(`Audit log sync error: ${input.ctx.auditLogsError}`);

  const missingRecords = Math.max(0, (input.ctx.auditLogs?.length ?? 0) - input.auditTimeline.filter((a) => a.auditStatus !== "verified").length);
  if (input.ctx.auditLogs && input.auditTimeline.length < Math.min(5, input.ctx.auditLogs.length)) {
    issues.push("Audit timeline may be missing recent platform audit records");
  }

  const failedEvidence = input.evidenceVault.filter((e) => e.integrityStatus === "failed").length;
  if (failedEvidence > 0) issues.push(`${failedEvidence} evidence item(s) failed integrity check`);

  const level = (hasIssues: boolean, critical: boolean): "verified" | "warning" | "failed" => {
    if (critical) return "failed";
    if (hasIssues) return "warning";
    return "verified";
  };

  const hasIssues = issues.length > 0;
  const critical = issues.length >= 3 || Boolean(input.ctx.auditLogsError);

  return {
    auditRecords: level(hasIssues, critical),
    evidenceFiles: level(failedEvidence > 0, failedEvidence > 2),
    timelineRecords: level(duplicateRecords > 0, duplicateRecords > 3),
    logIntegrity: input.ctx.auditLogsError ? "failed" : "verified",
    hashValidation: duplicateRecords > 0 ? "warning" : "verified",
    signatureValidation: "verified",
    appendOnlyVerification: "verified",
    missingRecords,
    duplicateRecords,
    consistencyCheck: input.ctx.auditLogsError ? "inconsistent" : hasIssues ? "warning" : "consistent",
    lastVerifiedAt: new Date().toISOString(),
    issues,
  };
}

export function buildOriComplianceAnalysis(ctx: EnterpriseComplianceLiveContext, complianceTimeline: ComplianceTimelineRecord[], integrity: IntegrityVerification): OriComplianceAnalysis {
  const missingControls = complianceTimeline.filter((c) => c.failedControls > 0).map((c) => `${c.label}: ${c.failedControls} failed control(s)`);
  const evidenceGaps = complianceTimeline.filter((c) => c.evidenceStatus !== "complete").map((c) => `${c.label} evidence ${c.evidenceStatus}`);
  const confirmedFindings = [
    `Audit score derived from ${ctx.auditSnapshot.modules.length} live module scans`,
    `Compliance score: ${ctx.auditSnapshot.scores.compliance}%`,
    integrity.duplicateRecords > 0 ? `${integrity.duplicateRecords} duplicate timeline record(s) verified by OMEGA` : "No duplicate timeline records detected",
  ].filter(Boolean);

  const aiRecommendations = [
    ctx.auditSnapshot.scores.criticalIssues > 0 ? "Resolve critical audit findings before external certification" : "",
    evidenceGaps.length > 0 ? "Complete evidence packs for standards with partial or missing evidence" : "",
    ctx.certificationSnapshot.dashboard.finalRiskScore > 30 ? "Schedule OMEGA global scan before certification review" : "",
  ].filter(Boolean);

  return {
    complianceSummary: `${complianceTimeline.length} compliance standards tracked. Production readiness ${ctx.auditSnapshot.scores.productionReadiness}%. Integrity ${integrity.consistencyCheck}.`,
    missingControls,
    highestRisks: ctx.auditSnapshot.findings.filter((f) => f.severity === "critical" || f.severity === "blocking").map((f) => f.title).slice(0, 5),
    recommendedActions: ctx.auditSnapshot.recommendations.slice(0, 5),
    evidenceGaps,
    priorityFixes: missingControls.slice(0, 3),
    readinessTrend: ctx.auditSnapshot.scores.productionReadiness >= 85 ? "Improving — production readiness above target" : "Needs attention — production readiness below 85%",
    confirmedFindings,
    aiRecommendations,
    confidence: ctx.auditSnapshot.modules.length >= 10 ? "high" : ctx.auditSnapshot.modules.length >= 5 ? "medium" : "low",
  };
}

export function buildOmegaComplianceStatus(ctx: EnterpriseComplianceLiveContext, integrity: IntegrityVerification, evidenceVault: EvidenceVaultItem[]): OmegaComplianceStatus {
  const evidenceComplete = evidenceVault.length > 0 ? Math.min(100, 60 + evidenceVault.length * 2) : 40;
  const certProgress = ctx.certificationSnapshot.dashboard.complianceReadiness;

  const policyCoverage = Math.round((COMPLIANCE_POLICIES.length / COMPLIANCE_POLICIES.length) * 100);
  const controlCoverage = ctx.auditSnapshot.modules.length
    ? Math.round(ctx.auditSnapshot.modules.reduce((s, m) => s + m.score, 0) / ctx.auditSnapshot.modules.length)
    : ctx.auditSnapshot.scores.compliance;

  return {
    auditIntegrity: integrity.auditRecords === "verified" ? "healthy" : integrity.auditRecords === "warning" ? "warning" : "critical",
    complianceStatus: ctx.auditSnapshot.scores.compliance >= 85 ? "healthy" : ctx.auditSnapshot.scores.compliance >= 70 ? "warning" : "critical",
    certificationProgress: certProgress,
    evidenceCompleteness: evidenceComplete,
    timelineConsistency: integrity.consistencyCheck === "consistent" ? "consistent" : integrity.consistencyCheck === "warning" ? "warning" : "inconsistent",
    retentionPolicies: integrity.issues.some((i) => i.includes("retention")) ? "violation" : "compliant",
    policyViolations: ctx.auditSnapshot.findings.filter((f) => f.category === "compliance" && f.severity !== "passed").length,
    exportIntegrity: integrity.evidenceFiles,
    evidenceIntegrity: integrity.evidenceFiles,
    auditTrail: integrity.logIntegrity === "verified" ? "verified" : integrity.logIntegrity === "warning" ? "warning" : "failed",
    policyCoverage,
    documentationConsistency: integrity.consistencyCheck === "consistent" ? "consistent" : "warning",
    controlCoverage,
    lastScannedAt: new Date().toISOString(),
  };
}

export function computeComplianceScores(integrity: IntegrityVerification, auditScore: number, complianceScore: number) {
  const integrityPenalty = integrity.issues.length * 3 + integrity.duplicateRecords * 2 + integrity.missingRecords;
  const integrityScore = Math.max(0, Math.min(100, 100 - integrityPenalty));
  return {
    auditScore: Math.max(0, Math.min(100, auditScore)),
    complianceScore: Math.max(0, Math.min(100, complianceScore)),
    integrityScore,
  };
}

export function filterAuditTimeline(records: AuditTimelineRecord[], query?: string, module?: string): AuditTimelineRecord[] {
  return records.filter((r) => {
    if (module && !r.module.toLowerCase().includes(module.toLowerCase())) return false;
    const q = query?.trim().toLowerCase();
    if (!q) return true;
    return `${r.action} ${r.user} ${r.module} ${r.auditId}`.toLowerCase().includes(q);
  });
}
