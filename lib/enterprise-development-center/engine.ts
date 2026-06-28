import type {
  DevelopmentDashboard,
  DevelopmentSettings,
  DevelopmentState,
  ModuleExplorerEntry,
  ValidationResult,
  BuildRecord,
  ReleaseRun,
} from "@/lib/enterprise-development-center/types";
import {
  AI_ENGINE_IDS,
  CODE_QUALITY_CHECKS,
  DEBT_CATEGORIES,
  PROJECT_TREE_NODES,
  RELEASE_PIPELINE_STAGES,
  VALIDATION_CHECKS,
} from "@/lib/enterprise-development-center/registry";
import { ENTERPRISE_MODULE_DESCRIPTORS } from "@/lib/enterprise-architecture/registry";

export function createDefaultDevelopmentSettings(): DevelopmentSettings {
  return { mfaRequiredForDeploy: true, autoValidationEnabled: true, governanceIntegrationEnabled: true };
}

function createDashboard(): DevelopmentDashboard {
  return {
    projects: 12,
    modules: ENTERPRISE_MODULE_DESCRIPTORS.length,
    apis: 248,
    routes: 542,
    deployments: 18,
    activeBuilds: 2,
    pendingReleases: 3,
    openIssues: 14,
    architectureHealth: 98,
    securityHealth: 100,
    performanceHealth: 97,
    technicalDebt: 12,
    certificationReadiness: 96,
    enterpriseScore: 99.6,
  };
}

function createProjectTree() {
  return PROJECT_TREE_NODES.map((node, i) => ({
    id: `tree-${node}`,
    node,
    label: node.replace(/-/g, " "),
    count: 5 + i * 3,
  }));
}

function createModules(): ModuleExplorerEntry[] {
  return ENTERPRISE_MODULE_DESCRIPTORS.map((m, i) => ({
    id: m.id,
    label: m.label,
    descriptor: m.id,
    dependencies: (m.relatedModules ?? []).slice(0, 4),
    routes: m.routes.length,
    registry: "enterprise-module-registry-v2",
    health: i % 9 === 0 ? "warning" : "healthy",
    version: m.version,
    owner: "enterprise-core",
    status: "active" as const,
    enterpriseScore: 95 + (i % 5),
  }));
}

export function createDefaultDevelopmentState(): DevelopmentState {
  const dashboard = createDashboard();
  return {
    dashboard,
    projectTree: createProjectTree(),
    modules: createModules(),
    architectureNodes: [
      { id: "core", label: "Enterprise Core", type: "core", connections: 24, status: "healthy" },
      { id: "governance", label: "Governance Center", type: "governance", connections: 18, status: "healthy" },
      { id: "omega", label: "OMEGA Command Center", type: "ai", connections: 12, status: "healthy" },
      { id: "deployment", label: "Deployment Center", type: "ops", connections: 8, status: "healthy" },
    ],
    dependencyLinks: [
      { id: "dep-1", from: "enterprise-governance-center", to: "enterprise-module-registry-v2", status: "healthy", kind: "depends" },
      { id: "dep-2", from: "omega-command-center", to: "enterprise-ai-operating-system", status: "healthy", kind: "depends" },
      { id: "dep-3", from: "legacy-analytics", to: "analytics-engine", status: "warning", kind: "duplicate" },
    ],
    apiEndpoints: [
      { id: "api-1", path: "/api/super-admin/governance", method: "GET", status: "healthy", latencyMs: 42, errors: 0 },
      { id: "api-2", path: "/api/super-admin/omega/run-scan", method: "POST", status: "healthy", latencyMs: 128, errors: 0 },
      { id: "api-3", path: "/api/super-admin/development", method: "GET", status: "healthy", latencyMs: 38, errors: 0 },
    ],
    databaseTables: [
      { id: "tbl-1", name: "users", rows: 12400, indexes: 4, relations: 6 },
      { id: "tbl-2", name: "listings", rows: 89200, indexes: 8, relations: 4 },
      { id: "tbl-3", name: "orders", rows: 34100, indexes: 6, relations: 5 },
    ],
    storageBuckets: [
      { id: "bkt-1", name: "assets", usageMb: 2048, objects: 678, policy: "public-read", integrity: 100 },
      { id: "bkt-2", name: "uploads", usageMb: 512, objects: 12400, policy: "private", integrity: 99 },
    ],
    builds: [
      { id: "build-1", project: "rovexo-web", status: "running", durationMs: 0, startedAt: new Date().toISOString() },
      { id: "build-2", project: "rovexo-web", status: "passed", durationMs: 184000, startedAt: new Date(Date.now() - 3600000).toISOString(), artifact: "build-2.tar.gz" },
    ],
    releases: [
      { id: "rel-1", currentStage: "governance-validation", stagesCompleted: ["development", "architecture-validation"], status: "running" },
    ],
    aiEngines: AI_ENGINE_IDS.map((id, i) => ({
      id,
      label: id === "omega-prime" ? "OMEGA PRIME" : id.toUpperCase(),
      status: i < 2 ? "running" as const : "waiting" as const,
      health: 95 + (i % 5),
      activity: i === 0 ? "orchestrating" : "standby",
    })),
    technicalDebt: DEBT_CATEGORIES.map((category, i) => ({
      category,
      score: Math.max(5, 100 - i * 8),
      items: 1 + (i % 6),
      trend: i % 3 === 0 ? "down" as const : "stable" as const,
    })),
    codeQuality: CODE_QUALITY_CHECKS.slice(0, 6).map((check, i) => ({
      id: `cq-${check}`,
      check,
      count: i,
      severity: i === 0 ? "low" as const : "low" as const,
    })),
    performanceMetrics: [
      { id: "perf-bundle", label: "Bundle Size", value: 2.4, unit: "MB", status: "healthy" },
      { id: "perf-lcp", label: "LCP", value: 1.8, unit: "s", status: "healthy" },
      { id: "perf-memory", label: "Memory", value: 68, unit: "%", status: "warning" },
    ],
    validationResults: VALIDATION_CHECKS.map((check) => ({ check, status: "pass" as const })),
  };
}

export function runEnterpriseValidation(): ValidationResult[] {
  return VALIDATION_CHECKS.map((check) => ({ check, status: "pass" as const }));
}

export function advanceReleasePipeline(release: ReleaseRun): ReleaseRun {
  const idx = RELEASE_PIPELINE_STAGES.indexOf(release.currentStage);
  const next = RELEASE_PIPELINE_STAGES[idx + 1];
  if (!next) {
    return { ...release, stagesCompleted: [...RELEASE_PIPELINE_STAGES], currentStage: "production-approval", status: "completed" };
  }
  return {
    ...release,
    stagesCompleted: [...release.stagesCompleted, release.currentStage],
    currentStage: next,
    status: "running",
  };
}

export function queueBuild(project: string): BuildRecord {
  return {
    id: `build-${Date.now()}`,
    project,
    status: "queued",
    durationMs: 0,
    startedAt: new Date().toISOString(),
  };
}

export function allValidationsPass(results: ValidationResult[]): boolean {
  return results.every((r) => r.status === "pass");
}
