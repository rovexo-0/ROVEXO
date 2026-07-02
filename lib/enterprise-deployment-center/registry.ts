export const DEPLOYMENT_CENTER_ROUTES = [
  { id: "dashboard", label: "Deployment Center", href: "/super-admin/deployment" },
  { id: "environments", label: "Environment Center", href: "/super-admin/deployment/environments" },
  { id: "releases", label: "Release Center", href: "/super-admin/deployment/releases" },
  { id: "builds", label: "Build & Deploy", href: "/super-admin/deployment/builds" },
  { id: "rollback", label: "Rollback Center", href: "/super-admin/deployment/rollback" },
] as const;

export const DEPLOYMENT_ENVIRONMENTS = [
  "development", "qa", "staging", "uat", "production", "disaster-recovery", "sandbox",
] as const;

export const RELEASE_TYPES = [
  "release-candidate", "beta", "internal", "public-release", "hotfix", "emergency-release", "scheduled-release",
] as const;

export const VALIDATION_TYPES = [
  "build-validation", "package-validation", "artifact-validation", "integrity-check",
  "environment-validation", "dependency-validation",
] as const;

export const DEPLOYMENT_STRATEGIES = [
  "standard", "blue-green", "canary", "rolling", "progressive-rollout",
  "region-rollout", "country-rollout", "feature-rollout",
] as const;

export const FEATURE_FLAG_RULES = [
  "percentage-rollout", "country-rules", "language-rules", "business-rules", "device-rules",
] as const;

export const WORKFLOW_STAGES = [
  "draft", "validation", "ai-analysis", "certification", "manual-approval",
  "deployment", "monitoring", "completed",
] as const;

export const POST_DEPLOY_CHECKS = [
  "health-checks", "api-validation", "database-validation", "queue-validation",
  "cron-validation", "payment-validation", "search-validation", "storage-validation",
  "notification-validation", "ai-validation",
] as const;

export const DEPLOYMENT_CENTER_API = {
  snapshot: "/api/super-admin/deployment",
  releases: "/api/super-admin/deployment/releases",
  environments: "/api/super-admin/deployment/environments",
  history: "/api/super-admin/deployment/history",
  build: "/api/super-admin/deployment/build",
  validate: "/api/super-admin/deployment/validate",
  deploy: "/api/super-admin/deployment/deploy",
  approve: "/api/super-admin/deployment/approve",
  reject: "/api/super-admin/deployment/reject",
  rollback: "/api/super-admin/deployment/rollback",
  cancel: "/api/super-admin/deployment/cancel",
  v1Snapshot: "/api/v1/super-admin/deployment",
} as const;

export const DEPLOYMENT_AI_PREDICTION_TYPES = [
  "risk-score", "deployment-recommendation", "rollback-recommendation",
  "performance-prediction", "failure-prediction", "traffic-prediction", "capacity-prediction",
] as const;
