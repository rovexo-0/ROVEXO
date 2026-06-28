import type {
  DEPLOYMENT_ENVIRONMENTS,
  DEPLOYMENT_STRATEGIES,
  FEATURE_FLAG_RULES,
  POST_DEPLOY_CHECKS,
  RELEASE_TYPES,
  VALIDATION_TYPES,
  WORKFLOW_STAGES,
  DEPLOYMENT_AI_PREDICTION_TYPES,
} from "@/lib/enterprise-deployment-center/registry";

export type DeploymentTab = "dashboard" | "environments" | "releases" | "builds" | "rollback";
export type DeploymentEnvironment = (typeof DEPLOYMENT_ENVIRONMENTS)[number];
export type ReleaseType = (typeof RELEASE_TYPES)[number];
export type ValidationType = (typeof VALIDATION_TYPES)[number];
export type DeploymentStrategy = (typeof DEPLOYMENT_STRATEGIES)[number];
export type FeatureFlagRule = (typeof FEATURE_FLAG_RULES)[number];
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];
export type PostDeployCheck = (typeof POST_DEPLOY_CHECKS)[number];
export type DeploymentAiPredictionType = (typeof DEPLOYMENT_AI_PREDICTION_TYPES)[number];

export type DeploymentEnvironmentState = {
  id: DeploymentEnvironment;
  label: string;
  version: string;
  status: "healthy" | "degraded" | "offline";
  lastDeployedAt?: string;
};

export type PlatformRelease = {
  id: string;
  type: ReleaseType;
  version: string;
  environment: DeploymentEnvironment;
  status: "draft" | "pending-approval" | "approved" | "deploying" | "deployed" | "failed" | "rolled-back";
  strategy: DeploymentStrategy;
  stage: WorkflowStage;
  createdAt: string;
  scheduledAt?: string;
  deployedAt?: string;
};

export type DeploymentBuild = {
  id: string;
  version: string;
  artifact: string;
  status: "queued" | "building" | "validated" | "failed";
  validations: ValidationType[];
  createdAt: string;
};

export type DeploymentQueueItem = {
  id: string;
  releaseId: string;
  version: string;
  environment: DeploymentEnvironment;
  strategy: DeploymentStrategy;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  stage: WorkflowStage;
  createdAt: string;
};

export type DeploymentFeatureFlag = {
  id: string;
  key: string;
  enabled: boolean;
  percentage: number;
  rules: FeatureFlagRule[];
};

export type ReleaseNotes = {
  version: string;
  newFeatures: string[];
  improvements: string[];
  bugFixes: string[];
  securityFixes: string[];
  performanceChanges: string[];
  databaseChanges: string[];
  apiChanges: string[];
  breakingChanges: string[];
  rollbackInstructions: string[];
};

export type DeploymentAiInsight = {
  id: string;
  type: DeploymentAiPredictionType;
  score: number;
  summary: string;
  recommendation?: string;
};

export type DeploymentSettings = {
  productionVersion: string;
  stagingVersion: string;
  developmentVersion: string;
  approvalRequired: boolean;
  certificationRequired: boolean;
  aiAnalysisRequired: boolean;
  defaultStrategy: DeploymentStrategy;
};

export type DeploymentDashboard = {
  productionVersion: string;
  stagingVersion: string;
  developmentVersion: string;
  lastDeployment: string;
  queueLength: number;
  deploymentHealth: number;
  buildStatus: "healthy" | "building" | "failed";
  certificationStatus: "certified" | "pending" | "failed";
  rollbackAvailable: boolean;
  activeReleases: number;
  pendingApprovals: number;
  failedDeployments: number;
};

export type DeploymentState = {
  environments: DeploymentEnvironmentState[];
  releases: PlatformRelease[];
  builds: DeploymentBuild[];
  queue: DeploymentQueueItem[];
  featureFlags: DeploymentFeatureFlag[];
  releaseNotes: ReleaseNotes[];
  aiInsights: DeploymentAiInsight[];
  deploymentHistory: DeploymentQueueItem[];
};

export type DeploymentSnapshot = {
  tab: DeploymentTab;
  dashboard: DeploymentDashboard;
  environments: DeploymentEnvironmentState[];
  releases: PlatformRelease[];
  builds: DeploymentBuild[];
  queue: DeploymentQueueItem[];
  featureFlags: DeploymentFeatureFlag[];
  releaseNotes: ReleaseNotes[];
  aiInsights: DeploymentAiInsight[];
  history: { id: string; action: string; actor: string; timestamp: string }[];
  auditLog: { id: string; action: string; actor: string; target: string; timestamp: string }[];
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
};
