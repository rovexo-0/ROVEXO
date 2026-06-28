import type {
  AI_ENGINE_IDS,
  BUILD_STATUSES,
  CODE_QUALITY_CHECKS,
  DEBT_CATEGORIES,
  PROJECT_TREE_NODES,
  RELEASE_PIPELINE_STAGES,
  VALIDATION_CHECKS,
} from "@/lib/enterprise-development-center/registry";

export type DevelopmentTab =
  | "dashboard"
  | "project-explorer"
  | "module-explorer"
  | "architecture-studio"
  | "api-studio"
  | "database-studio"
  | "storage-studio"
  | "devsecops"
  | "build-center"
  | "release-pipeline"
  | "registry-explorer"
  | "environment-center"
  | "ai-integration"
  | "technical-debt"
  | "dependency-graph"
  | "bundle-analyzer"
  | "performance"
  | "documentation"
  | "search"
  | "settings";

export type ProjectTreeNode = (typeof PROJECT_TREE_NODES)[number];
export type AiEngineId = (typeof AI_ENGINE_IDS)[number];
export type ReleasePipelineStage = (typeof RELEASE_PIPELINE_STAGES)[number];
export type BuildStatus = (typeof BUILD_STATUSES)[number];
export type CodeQualityCheck = (typeof CODE_QUALITY_CHECKS)[number];
export type DebtCategory = (typeof DEBT_CATEGORIES)[number];
export type ValidationCheck = (typeof VALIDATION_CHECKS)[number];

export type DevelopmentDashboard = {
  projects: number;
  modules: number;
  apis: number;
  routes: number;
  deployments: number;
  activeBuilds: number;
  pendingReleases: number;
  openIssues: number;
  architectureHealth: number;
  securityHealth: number;
  performanceHealth: number;
  technicalDebt: number;
  certificationReadiness: number;
  enterpriseScore: number;
};

export type ProjectTreeItem = { id: string; node: ProjectTreeNode; label: string; count: number };

export type ModuleExplorerEntry = {
  id: string;
  label: string;
  descriptor: string;
  dependencies: string[];
  routes: number;
  registry: string;
  health: "healthy" | "warning" | "critical";
  version: string;
  owner: string;
  status: "active" | "deprecated" | "draft";
  enterpriseScore: number;
};

export type ArchitectureNode = { id: string; label: string; type: string; connections: number; status: "healthy" | "warning" | "critical" };

export type DependencyLink = { id: string; from: string; to: string; status: "healthy" | "warning" | "critical" | "broken"; kind: "depends" | "cycle" | "duplicate" | "unused" };

export type ApiEndpoint = { id: string; path: string; method: string; status: "healthy" | "degraded" | "deprecated"; latencyMs: number; errors: number };

export type DatabaseTable = { id: string; name: string; rows: number; indexes: number; relations: number };

export type StorageBucket = { id: string; name: string; usageMb: number; objects: number; policy: string; integrity: number };

export type BuildRecord = { id: string; project: string; status: BuildStatus; durationMs: number; startedAt: string; artifact?: string };

export type ReleaseRun = { id: string; currentStage: ReleasePipelineStage; stagesCompleted: ReleasePipelineStage[]; status: "running" | "completed" | "blocked" };

export type AiEngineStatus = { id: AiEngineId; label: string; status: "running" | "waiting" | "offline"; health: number; activity: string };

export type TechnicalDebtItem = { category: DebtCategory; score: number; items: number; trend: "up" | "down" | "stable" };

export type CodeQualityIssue = { id: string; check: CodeQualityCheck; count: number; severity: "low" | "medium" | "high" };

export type PerformanceMetric = { id: string; label: string; value: number; unit: string; status: "healthy" | "warning" | "critical" };

export type ValidationResult = { check: ValidationCheck; status: "pass" | "fail" | "warning" };

export type DevelopmentSettings = { mfaRequiredForDeploy: boolean; autoValidationEnabled: boolean; governanceIntegrationEnabled: boolean };

export type DevelopmentState = {
  dashboard: DevelopmentDashboard;
  projectTree: ProjectTreeItem[];
  modules: ModuleExplorerEntry[];
  architectureNodes: ArchitectureNode[];
  dependencyLinks: DependencyLink[];
  apiEndpoints: ApiEndpoint[];
  databaseTables: DatabaseTable[];
  storageBuckets: StorageBucket[];
  builds: BuildRecord[];
  releases: ReleaseRun[];
  aiEngines: AiEngineStatus[];
  technicalDebt: TechnicalDebtItem[];
  codeQuality: CodeQualityIssue[];
  performanceMetrics: PerformanceMetric[];
  validationResults: ValidationResult[];
};

export type DevelopmentSnapshot = {
  tab: DevelopmentTab;
  dashboard: DevelopmentDashboard;
  projectTree: ProjectTreeItem[];
  modules: ModuleExplorerEntry[];
  architectureNodes: ArchitectureNode[];
  dependencyLinks: DependencyLink[];
  apiEndpoints: ApiEndpoint[];
  databaseTables: DatabaseTable[];
  storageBuckets: StorageBucket[];
  builds: BuildRecord[];
  releases: ReleaseRun[];
  aiEngines: AiEngineStatus[];
  technicalDebt: TechnicalDebtItem[];
  codeQuality: CodeQualityIssue[];
  performanceMetrics: PerformanceMetric[];
  validationResults: ValidationResult[];
  settings: DevelopmentSettings;
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
};
