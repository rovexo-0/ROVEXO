import { ENTERPRISE_MODULE_DESCRIPTORS } from "@/lib/enterprise-architecture/registry";
import {
  BOARD_METRICS,
  CODE_ANALYSIS_DOMAINS,
  DISCOVERY_CATEGORIES,
  INSIGHT_CATEGORIES,
  PROTECTED_AREAS,
  REPAIR_STAGES,
  ROADMAP_PRIORITIES,
} from "@/lib/omega-development-director/registry";
import type {
  BoardMetric,
  CodeAnalysisResult,
  DependencyIssue,
  DependencyNode,
  DevDirectorDashboard,
  DevDirectorSettings,
  DevDirectorState,
  DevDirectorStatus,
  DevelopmentInsight,
  DiscoveryFinding,
  FeatureImplementation,
  ModuleCoordination,
  PipelineItem,
  RepairProposal,
  RoadmapItem,
  DevDirectorAuditEntry,
} from "@/lib/omega-development-director/types";

export function createDefaultDevDirectorSettings(): DevDirectorSettings {
  return {
    autonomousAnalysisEnabled: true,
    recommendationOnlyMode: true,
    blockProtectedAreaChanges: true,
    coordinateWithQa: true,
    coordinateWithGovernance: true,
  };
}

function statusForIndex(index: number): DevDirectorStatus {
  if (index % 19 === 0) return "fail";
  if (index % 8 === 0) return "warning";
  if (index % 13 === 0) return "blocked";
  return "pass";
}

function createDashboard(): DevDirectorDashboard {
  return {
    developmentProgress: 87.4,
    platformCompletion: 91.2,
    openFindings: 24,
    roadmapItems: 18,
    repairQueue: 4,
    enterpriseScore: 98.6,
    deploymentReadiness: 89.5,
  };
}

function createBoardMetrics(): BoardMetric[] {
  const scores: Record<string, number> = {
    "development-progress": 87.4,
    "platform-completion": 91.2,
    "technical-debt": 12.8,
    "enterprise-score": 98.6,
    "architecture-health": 96.3,
    "module-health": 97.1,
    "certification-progress": 84.2,
    "qa-progress": 96.8,
    "performance-progress": 94.5,
    "security-progress": 99.2,
    "accessibility-progress": 98.1,
    "deployment-readiness": 89.5,
  };
  return BOARD_METRICS.map((key, i) => ({
    key,
    label: key.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    score: scores[key] ?? 90,
    status: statusForIndex(i),
    trend: i % 3 === 0 ? "up" : i % 3 === 1 ? "stable" : "down",
  }));
}

function createCodeAnalysis(): CodeAnalysisResult[] {
  return CODE_ANALYSIS_DOMAINS.map((domain, i) => ({
    domain,
    label: domain.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    coverage: Math.max(82, 100 - (i % 6) * 3),
    issues: statusForIndex(i) === "pass" ? 0 : statusForIndex(i) === "warning" ? 2 : 5,
    status: statusForIndex(i),
    lastAnalyzedAt: new Date(Date.now() - i * 1800000).toISOString(),
  }));
}

function createDiscoveries(): DiscoveryFinding[] {
  return DISCOVERY_CATEGORIES.slice(0, 12).map((category, i) => ({
    id: `disc-${category}`,
    category,
    label: category.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    target: i === 0 ? "omega-development-director" : i === 1 ? "/super-admin/new-module" : `feature-${i}`,
    severity: ROADMAP_PRIORITIES[Math.min(i, ROADMAP_PRIORITIES.length - 1)] as RoadmapItem["priority"],
    status: statusForIndex(i),
    detectedAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

function createImplementations(): FeatureImplementation[] {
  const features = [
    { id: "feat-qa-center", feature: "OMEGA Quality Assurance Center", moduleId: "omega-quality-assurance-center", stage: "released" as const, progress: 100 },
    { id: "feat-dev-director", feature: "OMEGA Development Director", moduleId: "omega-development-director", stage: "development" as const, progress: 75 },
    { id: "feat-listing-ai", feature: "Listing AI Validation", moduleId: "ai-engine", stage: "qa" as const, progress: 88 },
    { id: "feat-checkout-polish", feature: "Checkout UX Polish", stage: "testing" as const, progress: 65 },
    { id: "feat-seller-payout", feature: "Seller Payout Dashboard", stage: "architecture-ready" as const, progress: 40 },
  ];
  return features.map((f) => ({
    ...f,
    blockers: f.progress < 100 && f.stage !== "released" ? [] : [],
  }));
}

function createRoadmap(): RoadmapItem[] {
  return [
    { id: "rm-1", title: "Complete Development Director integration", priority: "critical", dependencies: ["omega-quality-assurance-center"], complexity: "high", riskScore: 15, businessImpact: 70, enterpriseImpact: 95, certificationImpact: 90, stage: "development" },
    { id: "rm-2", title: "Automated dependency graph refresh", priority: "high", dependencies: ["enterprise-module-registry-v2"], complexity: "medium", riskScore: 25, businessImpact: 40, enterpriseImpact: 85, certificationImpact: 80, stage: "planning" },
    { id: "rm-3", title: "Missing translation audit", priority: "medium", dependencies: [], complexity: "low", riskScore: 10, businessImpact: 55, enterpriseImpact: 45, certificationImpact: 50, stage: "not-started" },
    { id: "rm-4", title: "Performance bottleneck remediation", priority: "high", dependencies: ["enterprise-development-center"], complexity: "high", riskScore: 35, businessImpact: 60, enterpriseImpact: 70, certificationImpact: 65, stage: "architecture-ready" },
    { id: "rm-5", title: "Accessibility sweep — super admin", priority: "medium", dependencies: ["omega-quality-assurance-center"], complexity: "medium", riskScore: 20, businessImpact: 30, enterpriseImpact: 75, certificationImpact: 85, stage: "testing" },
    { id: "rm-6", title: "Future: Multi-region deployment prep", priority: "future", dependencies: ["enterprise-deployment-center"], complexity: "critical", riskScore: 50, businessImpact: 80, enterpriseImpact: 90, certificationImpact: 95, stage: "not-started" },
  ];
}

function createDependencyGraph(): { nodes: DependencyNode[]; issues: DependencyIssue[] } {
  const modules = ENTERPRISE_MODULE_DESCRIPTORS.slice(0, 8);
  const nodes: DependencyNode[] = modules.map((m, i) => ({
    id: m.id,
    label: m.label,
    type: "module" as const,
    dependencies: m.relatedModules?.slice(0, 2) ?? [],
    dependents: i > 0 ? [modules[i - 1]!.id] : [],
    status: statusForIndex(i),
  }));
  const issues: DependencyIssue[] = [
    { id: "dep-1", type: "missing-registration", message: "Module not in Registry V2 category map", moduleId: "legacy-analytics", severity: "medium" },
    { id: "dep-2", type: "broken-import", message: "Circular import between feature shells", moduleId: "visual-cms", severity: "high" },
    { id: "dep-3", type: "unused-service", message: "Unused KV reader in deprecated path", severity: "low" },
  ];
  return { nodes, issues };
}

function createPipeline(): PipelineItem[] {
  return [
    { id: "pipe-1", feature: "OMEGA Development Director", currentStage: "development", stagesCompleted: ["development"], blocked: false, awaitingApproval: false },
    { id: "pipe-2", feature: "Listing AI Validation", currentStage: "qa-center", stagesCompleted: ["development", "qa-center"], blocked: false, awaitingApproval: false },
    { id: "pipe-3", feature: "Checkout UX Polish", currentStage: "security-center", stagesCompleted: ["development", "qa-center", "security-center"], blocked: false, awaitingApproval: true },
    { id: "pipe-4", feature: "Seller Payout Dashboard", currentStage: "development", stagesCompleted: [], blocked: true, awaitingApproval: false },
  ];
}

function createRepairProposals(): RepairProposal[] {
  return [
    {
      id: "rep-1",
      issue: "Duplicate card component in features/home and features/categories",
      rootCause: "Parallel implementation without shared design system export",
      proposal: "Extract CategoryCompactCard variant to shared components — recommendation only",
      stage: "ready-for-review",
      status: "pass",
      protectedAreaViolation: false,
      readyForReview: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "rep-2",
      issue: "Missing aria-label on super admin state tabs",
      rootCause: "Premium shell migration omitted accessibility attribute",
      proposal: "Add aria-label to EnterpriseAdminShell state tab navigation",
      stage: "governance",
      status: "running",
      protectedAreaViolation: false,
      readyForReview: false,
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: "rep-3",
      issue: "Attempted auto-fix on checkout redirect",
      rootCause: "Protected area — checkout workflow",
      proposal: "BLOCKED: Requires human approval — checkout is protected",
      stage: "analyze",
      status: "blocked",
      protectedAreaViolation: true,
      readyForReview: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

function createInsights(): DevelopmentInsight[] {
  return INSIGHT_CATEGORIES.map((category, i) => ({
    id: `ins-${category}`,
    category,
    title: `${category.charAt(0).toUpperCase()}${category.slice(1)} improvement opportunity`,
    summary: `OMEGA recommends ${category} enhancement based on codebase analysis — no production changes applied.`,
    impact: ROADMAP_PRIORITIES[Math.min(i, 2)] as RoadmapItem["priority"],
    recommendationOnly: true as const,
  }));
}

function createCoordinations(): ModuleCoordination[] {
  return [
    { moduleId: "omega-quality-assurance-center", label: "OMEGA QA Center", role: "Validation gate", status: "pass", lastSyncAt: new Date().toISOString(), pendingRecommendations: 2 },
    { moduleId: "enterprise-governance-center", label: "Governance Center", role: "Constitution & certification", status: "pass", lastSyncAt: new Date().toISOString(), pendingRecommendations: 0 },
    { moduleId: "enterprise-security-operations-center", label: "Security SOC", role: "Security validation", status: "pass", lastSyncAt: new Date().toISOString(), pendingRecommendations: 1 },
    { moduleId: "certification-center", label: "Certification Center", role: "Production gate", status: "pass", lastSyncAt: new Date().toISOString(), pendingRecommendations: 3 },
    { moduleId: "enterprise-deployment-center", label: "Deployment Center", role: "Release orchestration", status: "warning", lastSyncAt: new Date().toISOString(), pendingRecommendations: 1 },
    { moduleId: "omega-command-center", label: "OMEGA Command", role: "AI orchestration", status: "pass", lastSyncAt: new Date().toISOString(), pendingRecommendations: 0 },
    { moduleId: "enterprise-development-center", label: "Development Center", role: "Engineering studio", status: "pass", lastSyncAt: new Date().toISOString(), pendingRecommendations: 4 },
  ];
}

function createAuditEntries(): DevDirectorAuditEntry[] {
  return [
    { id: "aud-1", action: "full-codebase-analysis", actor: "omega-development-director", target: "global", timestamp: new Date(Date.now() - 7200000).toISOString(), result: "pass" },
    { id: "aud-2", action: "discovery-scan", actor: "omega-development-director", target: "discovery", timestamp: new Date(Date.now() - 3600000).toISOString(), result: "pass" },
    { id: "aud-3", action: "protected-area-block", actor: "omega-development-director", target: "checkout", timestamp: new Date().toISOString(), result: "blocked" },
  ];
}

export function createDefaultDevDirectorState(): DevDirectorState {
  return {
    dashboard: createDashboard(),
    boardMetrics: createBoardMetrics(),
    codeAnalysis: createCodeAnalysis(),
    discoveries: createDiscoveries(),
    implementations: createImplementations(),
    roadmap: createRoadmap(),
    dependencyGraph: createDependencyGraph(),
    pipeline: createPipeline(),
    repairProposals: createRepairProposals(),
    insights: createInsights(),
    coordinations: createCoordinations(),
    auditEntries: createAuditEntries(),
  };
}

export function computeDevDirectorEnterpriseScore(state: Pick<DevDirectorState, "dashboard" | "boardMetrics">): number {
  const metrics = [state.dashboard.enterpriseScore, state.dashboard.developmentProgress, ...state.boardMetrics.map((m) => m.score)];
  const avg = metrics.reduce((sum, v) => sum + v, 0) / metrics.length;
  return Math.round(avg * 100) / 100;
}

export function runCodebaseAnalysis(): CodeAnalysisResult[] {
  return CODE_ANALYSIS_DOMAINS.map((domain, i) => ({
    domain,
    label: domain.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    coverage: Math.max(85, 98 - (i % 4)),
    issues: i % 9 === 0 ? 1 : 0,
    status: i % 9 === 0 ? "warning" : "pass",
    lastAnalyzedAt: new Date().toISOString(),
  }));
}

export function runDiscoveryScan(): DiscoveryFinding[] {
  return DISCOVERY_CATEGORIES.slice(0, 6).map((category, i) => ({
    id: `scan-${category}-${Date.now()}`,
    category,
    label: `Discovered: ${category.replace(/-/g, " ")}`,
    target: `scan-target-${i}`,
    severity: i < 2 ? "critical" : "medium",
    status: "pending",
    detectedAt: new Date().toISOString(),
  }));
}

export function generateRepairProposal(issue: string, target?: string): RepairProposal {
  const isProtected = PROTECTED_AREAS.some((area) => issue.toLowerCase().includes(area.replace(/-/g, " ")) || target?.toLowerCase().includes(area));
  return {
    id: `rep-${Date.now()}`,
    issue,
    rootCause: isProtected ? "Protected area — changes require explicit human approval" : "Automated root cause analysis",
    proposal: isProtected ? "BLOCKED: Protected area — recommendation only, no auto-modification" : "Safe repair proposal — awaits QA, Security, Governance, and Certification",
    stage: "analyze",
    status: isProtected ? "blocked" : "pending",
    protectedAreaViolation: isProtected,
    readyForReview: false,
    createdAt: new Date().toISOString(),
  };
}

export function advanceRepairProposal(proposal: RepairProposal): RepairProposal {
  if (proposal.protectedAreaViolation) return proposal;
  const idx = REPAIR_STAGES.indexOf(proposal.stage);
  const next = REPAIR_STAGES[Math.min(idx + 1, REPAIR_STAGES.length - 1)] ?? proposal.stage;
  return {
    ...proposal,
    stage: next,
    status: next === "ready-for-review" ? "pass" : "running",
    readyForReview: next === "ready-for-review",
  };
}

export function prioritizeRoadmap(items: RoadmapItem[]): RoadmapItem[] {
  const order = ROADMAP_PRIORITIES;
  return [...items].sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority));
}

export function isProtectedTarget(target: string): boolean {
  const normalized = target.toLowerCase();
  return PROTECTED_AREAS.some((area) => normalized.includes(area.replace(/-/g, "")) || normalized.includes(area));
}

export function allPipelineStagesComplete(item: PipelineItem): boolean {
  return item.stagesCompleted.includes("production");
}
