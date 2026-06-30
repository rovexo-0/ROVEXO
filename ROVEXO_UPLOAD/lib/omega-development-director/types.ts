import type {
  BOARD_METRICS,
  CODE_ANALYSIS_DOMAINS,
  DISCOVERY_CATEGORIES,
  IMPLEMENTATION_STAGES,
  INSIGHT_CATEGORIES,
  QUALITY_PIPELINE_STAGES,
  REPAIR_STAGES,
  ROADMAP_PRIORITIES,
  EXPORT_FORMATS,
} from "@/lib/omega-development-director/registry";

export type DevDirectorTab =
  | "dashboard"
  | "analysis"
  | "discovery"
  | "status"
  | "roadmap"
  | "dependencies"
  | "pipeline"
  | "repair"
  | "insights"
  | "coordination"
  | "reports";

export type CodeAnalysisDomain = (typeof CODE_ANALYSIS_DOMAINS)[number];
export type DiscoveryCategory = (typeof DISCOVERY_CATEGORIES)[number];
export type ImplementationStage = (typeof IMPLEMENTATION_STAGES)[number];
export type RoadmapPriority = (typeof ROADMAP_PRIORITIES)[number];
export type QualityPipelineStage = (typeof QUALITY_PIPELINE_STAGES)[number];
export type RepairStage = (typeof REPAIR_STAGES)[number];
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];
export type BoardMetricKey = (typeof BOARD_METRICS)[number];
export type DevDirectorExportFormat = (typeof EXPORT_FORMATS)[number];
export type DevDirectorStatus = "pass" | "warning" | "fail" | "pending" | "running" | "blocked";

export type BoardMetric = {
  key: BoardMetricKey;
  label: string;
  score: number;
  status: DevDirectorStatus;
  trend: "up" | "down" | "stable";
};

export type CodeAnalysisResult = {
  domain: CodeAnalysisDomain;
  label: string;
  coverage: number;
  issues: number;
  status: DevDirectorStatus;
  lastAnalyzedAt: string;
};

export type DiscoveryFinding = {
  id: string;
  category: DiscoveryCategory;
  label: string;
  target: string;
  severity: RoadmapPriority;
  status: DevDirectorStatus;
  detectedAt: string;
};

export type FeatureImplementation = {
  id: string;
  feature: string;
  moduleId?: string;
  stage: ImplementationStage;
  progress: number;
  blockers: string[];
};

export type RoadmapItem = {
  id: string;
  title: string;
  priority: RoadmapPriority;
  dependencies: string[];
  complexity: "low" | "medium" | "high" | "critical";
  riskScore: number;
  businessImpact: number;
  enterpriseImpact: number;
  certificationImpact: number;
  stage: ImplementationStage;
};

export type DependencyNode = {
  id: string;
  label: string;
  type: "module" | "api" | "service" | "database";
  dependencies: string[];
  dependents: string[];
  status: DevDirectorStatus;
};

export type DependencyIssue = {
  id: string;
  type: "circular" | "broken-import" | "missing-registration" | "invalid-reference" | "unused-service" | "unused-table";
  message: string;
  moduleId?: string;
  severity: RoadmapPriority;
};

export type PipelineItem = {
  id: string;
  feature: string;
  currentStage: QualityPipelineStage;
  stagesCompleted: QualityPipelineStage[];
  blocked: boolean;
  awaitingApproval: boolean;
};

export type RepairProposal = {
  id: string;
  issue: string;
  rootCause: string;
  proposal: string;
  stage: RepairStage;
  status: DevDirectorStatus;
  protectedAreaViolation: boolean;
  readyForReview: boolean;
  createdAt: string;
};

export type DevelopmentInsight = {
  id: string;
  category: InsightCategory;
  title: string;
  summary: string;
  impact: RoadmapPriority;
  recommendationOnly: true;
};

export type ModuleCoordination = {
  moduleId: string;
  label: string;
  role: string;
  status: DevDirectorStatus;
  lastSyncAt: string;
  pendingRecommendations: number;
};

export type DevDirectorAuditEntry = {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  result: DevDirectorStatus;
};

export type DevDirectorSettings = {
  autonomousAnalysisEnabled: boolean;
  recommendationOnlyMode: boolean;
  blockProtectedAreaChanges: boolean;
  coordinateWithQa: boolean;
  coordinateWithGovernance: boolean;
};

export type DevDirectorDashboard = {
  developmentProgress: number;
  platformCompletion: number;
  openFindings: number;
  roadmapItems: number;
  repairQueue: number;
  enterpriseScore: number;
  deploymentReadiness: number;
};

export type DevDirectorState = {
  dashboard: DevDirectorDashboard;
  boardMetrics: BoardMetric[];
  codeAnalysis: CodeAnalysisResult[];
  discoveries: DiscoveryFinding[];
  implementations: FeatureImplementation[];
  roadmap: RoadmapItem[];
  dependencyGraph: { nodes: DependencyNode[]; issues: DependencyIssue[] };
  pipeline: PipelineItem[];
  repairProposals: RepairProposal[];
  insights: DevelopmentInsight[];
  coordinations: ModuleCoordination[];
  auditEntries: DevDirectorAuditEntry[];
};

export type DevDirectorSnapshot = DevDirectorState & {
  tab: DevDirectorTab;
  settings: DevDirectorSettings;
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "critical" | "failed"; score: number; message: string };
};
