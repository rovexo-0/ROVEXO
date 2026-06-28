import type {
  AI_ASSISTANT_CAPABILITIES,
  EDITOR_FIELDS,
  EXPORT_FORMATS,
  IMPORT_EXPORT_FORMATS,
  INSPECTOR_CHECKS,
  OMEGA_CATEGORY_SCORES,
  REPORT_TYPES,
  TREE_FEATURES,
  VALIDATION_CHECKS,
} from "@/lib/enterprise-category-management-center/registry";

export type CategoryManagementTab =
  | "dashboard"
  | "tree"
  | "editor"
  | "ai"
  | "analytics"
  | "import-export"
  | "versions"
  | "validation"
  | "certification"
  | "reports";

export type CategoryManagementStatus = "pass" | "warning" | "fail" | "pending" | "running" | "blocked" | "draft" | "active" | "inactive" | "hidden";

export type CategoryManagementDashboard = {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  draftCategories: number;
  roots: number;
  branches: number;
  leaves: number;
  overallPassPercent: number;
  certificationGranted: boolean;
  enterpriseScore: number;
  lastSyncAt?: string;
};

export type OmegaCategoryScore = {
  key: (typeof OMEGA_CATEGORY_SCORES)[number];
  label: string;
  score: number;
  status: CategoryManagementStatus;
  weight: number;
};

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  pathLabel: string;
  status: CategoryManagementStatus;
  listingCount: number;
  childCount: number;
  isPinned: boolean;
  isFavorite: boolean;
  colorTag?: string;
  lastModifiedAt: string;
};

export type CategoryWorkspace = {
  categoryId: string;
  name: string;
  slug: string;
  parent: string;
  level: number;
  visibility: string;
  listingCount: number;
  businessCount: number;
  popularity: number;
  growth: number;
  trustScore: number;
  certificationStatus: CategoryManagementStatus;
  lastValidationAt: string;
  lastModifiedAt: string;
  createdBy: string;
};

export type InspectorCheck = {
  id: string;
  check: (typeof INSPECTOR_CHECKS)[number];
  label: string;
  status: CategoryManagementStatus;
  details: string;
  lastCheckedAt: string;
};

export type AiSuggestion = {
  id: string;
  capability: (typeof AI_ASSISTANT_CAPABILITIES)[number];
  label: string;
  suggestion: string;
  confidence: number;
  status: CategoryManagementStatus;
};

export type CategoryAnalytics = {
  id: string;
  label: string;
  value: string | number;
  trend?: string;
  status: CategoryManagementStatus;
};

export type ValidationItem = {
  id: string;
  check: (typeof VALIDATION_CHECKS)[number];
  label: string;
  status: CategoryManagementStatus;
  findings: number;
  lastValidatedAt: string;
};

export type VersionEntry = {
  id: string;
  version: string;
  action: string;
  actor: string;
  timestamp: string;
  rollbackAvailable: boolean;
};

export type ImportExportJob = {
  id: string;
  format: (typeof IMPORT_EXPORT_FORMATS)[number];
  direction: "import" | "export" | "backup" | "restore";
  status: CategoryManagementStatus;
  records: number;
  conflicts: number;
  createdAt: string;
};

export type CategoryManagementReport = {
  id: string;
  type: (typeof REPORT_TYPES)[number];
  title: string;
  generatedAt: string;
  status: CategoryManagementStatus;
};

export type CategoryManagementAuditEntry = {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  result: CategoryManagementStatus;
};

export type CategoryManagementSettings = {
  validationOnlyMode: boolean;
  blockProtectedAreaFixes: boolean;
  coordinateWithQa: boolean;
  coordinateWithGovernance: boolean;
  requirePass100: boolean;
  enableAiAssistant: boolean;
  enableVersionControl: boolean;
};

export type CategoryManagementState = {
  dashboard: CategoryManagementDashboard;
  omegaScores: OmegaCategoryScore[];
  treeNodes: CategoryTreeNode[];
  workspace: CategoryWorkspace | null;
  inspectorChecks: InspectorCheck[];
  aiSuggestions: AiSuggestion[];
  analytics: CategoryAnalytics[];
  validationItems: ValidationItem[];
  versions: VersionEntry[];
  importExportJobs: ImportExportJob[];
  reports: CategoryManagementReport[];
  auditEntries: CategoryManagementAuditEntry[];
  editorFields: (typeof EDITOR_FIELDS)[number][];
  treeFeatures: (typeof TREE_FEATURES)[number][];
};

export type CategoryManagementSnapshot = CategoryManagementState & {
  tab: CategoryManagementTab;
  settings: CategoryManagementSettings;
  history: { id: string; action: string; actor: string; timestamp: string }[];
  auditLog: { id: string; action: string; actor: string; target: string; timestamp: string }[];
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "critical"; score: number; message: string };
};

export type CategoryManagementExportFormat = (typeof EXPORT_FORMATS)[number];
