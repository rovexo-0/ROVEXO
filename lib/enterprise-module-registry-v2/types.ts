export type RegistryV2Category =
  | "enterprise-core"
  | "mission-control"
  | "platform-studio"
  | "theme-studio"
  | "visual-cms"
  | "asset-manager"
  | "recovery"
  | "audit"
  | "certification"
  | "developer"
  | "operations"
  | "analytics"
  | "orders"
  | "shipping"
  | "wallet"
  | "payments"
  | "buyer-protection"
  | "messages"
  | "notifications"
  | "ai"
  | "search"
  | "security"
  | "integrations"
  | "marketplace"
  | "system";

export type ModuleLifecycleState =
  | "discovered"
  | "registered"
  | "initializing"
  | "ready"
  | "healthy"
  | "warning"
  | "maintenance"
  | "updating"
  | "publishing"
  | "rollback"
  | "rolling-back"
  | "disabled"
  | "archived"
  | "deprecated"
  | "recovery"
  | "failed";

export type ModuleVisibility = "public" | "internal" | "restricted" | "hidden";
export type ModuleStatus = "active" | "beta" | "preview" | "deprecated" | "disabled";
export type ModuleHealthLevel = "healthy" | "warning" | "critical" | "unknown" | "failed";

export type RegistryV2Route = { id: string; label: string; href: string };
export type RegistryV2NavItem = { id: string; label: string; href: string; icon?: string };

export type FeatureFlagScope = "global" | "module" | "role" | "environment" | "country" | "platform";

export type RegistryV2FeatureFlag = {
  id: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
  scope?: FeatureFlagScope;
  scheduledActivation?: string;
  scheduledDeactivation?: string;
  environmentOverrides?: Record<string, boolean>;
  countryOverrides?: Record<string, boolean>;
  roleOverrides?: Record<string, boolean>;
  platformOverrides?: Record<string, boolean>;
  emergencyKillSwitch?: boolean;
};

export type RegistryV2Permission = {
  action: string;
  label: string;
  roles: Array<"super-admin">;
  requiresMfa?: boolean;
  requiresBiometric?: boolean;
};

export type RegistryV2SettingsSchema = {
  draftKey: string;
  liveKey: string;
  historyKey: string;
  settingsKey: string;
  fields: Array<{ id: string; label: string; type: string }>;
};

export type RegistryV2ApiSchema = {
  snapshot: string;
  action: string;
  v1Snapshot: string;
  v1Action: string;
  health: string;
};

export type RegistryV2ProviderRef = {
  id: string;
  label: string;
  endpoint?: string;
  enabled: boolean;
};

export type RegistryV2Widget = { id: string; label: string; href?: string };

export type EnterpriseModuleV2Descriptor = {
  moduleId: string;
  moduleName: string;
  displayName: string;
  category: RegistryV2Category;
  version: string;
  description: string;
  owner: string;
  icon: string;
  dependencies: string[];
  routes: RegistryV2Route[];
  navigation: RegistryV2NavItem[];
  permissions: RegistryV2Permission[];
  featureFlags: RegistryV2FeatureFlag[];
  settingsSchema: RegistryV2SettingsSchema;
  /** Alias for settingsSchema — configuration-first architecture */
  configurationSchema: RegistryV2SettingsSchema;
  apiSchema: RegistryV2ApiSchema;
  healthEndpoint: string;
  healthProvider: RegistryV2ProviderRef;
  auditProvider: RegistryV2ProviderRef;
  analyticsProvider: RegistryV2ProviderRef;
  searchProvider: RegistryV2ProviderRef;
  monitoringProvider: RegistryV2ProviderRef;
  recoveryProvider: RegistryV2ProviderRef;
  certificationProvider: RegistryV2ProviderRef;
  lifecycleProvider: RegistryV2ProviderRef;
  widgets: RegistryV2Widget[];
  assets: string[];
  visibility: ModuleVisibility;
  priority: number;
  status: ModuleStatus;
  tags: string[];
  buildVersion: string;
  compatibilityVersion: string;
  baseHref: string;
  autoRegister: boolean;
  lifecycle: ModuleLifecycleState;
  health: ModuleHealthLevel;
  registeredAt: string;
  updatedAt: string;
  lastBuild: string | null;
  lastPublish: string | null;
};

export type DependencyGraphNode = {
  moduleId: string;
  moduleName: string;
  category: RegistryV2Category;
  version: string;
  dependencies: string[];
  dependents: string[];
};

export type HealthDependencyChainEntry = {
  moduleId: string;
  chain: string[];
  health: ModuleHealthLevel;
};

export type DependencyGraphAnalysis = {
  nodes: DependencyGraphNode[];
  edges: Array<{ from: string; to: string }>;
  parentModules: Record<string, string[]>;
  childModules: Record<string, string[]>;
  circularDependencies: string[][];
  unusedModules: string[];
  missingDependencies: Array<{ moduleId: string; missing: string }>;
  duplicateModules: string[];
  versionConflicts: Array<{ moduleId: string; dependency: string; expected: string; actual: string }>;
  healthDependencyChain: HealthDependencyChainEntry[];
};

export type ModuleValidationResult = {
  moduleId: string;
  valid: boolean;
  score: number;
  checks: Array<{ id: string; label: string; passed: boolean; message?: string }>;
};

export type RegistryValidationReport = {
  scannedAt: string;
  overallValid: boolean;
  overallScore: number;
  modules: ModuleValidationResult[];
};

export type RegistryDashboardMetrics = {
  registeredModules: number;
  healthyModules: number;
  warningModules: number;
  criticalModules: number;
  failedModules: number;
  disabledModules: number;
  updatesAvailable: number;
  pendingPublish: number;
  pendingRollback: number;
  healthScore: number;
  registryHealth: number;
  dependencyHealth: number;
  enterpriseScore: number;
  architectureCompliance: number;
};

export type RegistryFeatureFlagState = {
  moduleId: string;
  flagId: string;
  enabled: boolean;
  source: "default" | "live" | "scheduled" | "override" | "kill-switch";
};

export type RegistryVersionEntry = {
  id: string;
  moduleId: string;
  version: string;
  compatibilityVersion: string;
  publishedAt: string;
  publishedBy: string;
  releaseNotes: string;
  rollbackAvailable: boolean;
};

export type RegistryHistoryEntry = {
  id: string;
  action: string;
  moduleId?: string;
  actorId: string;
  timestamp: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
};

export type RegistryV2Document = {
  label: "Draft" | "Live" | "Archived" | "Preview";
  version: string;
  updatedAt: string;
  modules: EnterpriseModuleV2Descriptor[];
  featureFlagOverrides: Record<string, Record<string, boolean>>;
  globalFeatureFlags: Record<string, boolean>;
  disabledModules: string[];
  auditLog: RegistryHistoryEntry[];
  snapshots: Array<{ id: string; label: string; createdAt: string; version: string }>;
};

export type RegistryV2HistoryBundle = {
  id: string;
  publishedAt: string;
  publishedBy: string;
  label: string;
  bundle: RegistryV2Document;
  rollbackAvailable: boolean;
};

export type RegistrySearchResult = {
  id: string;
  moduleId: string;
  title: string;
  subtitle: string;
  href: string;
  matchType: "module" | "category" | "route" | "permission" | "tag" | "feature-flag" | "dependency" | "api" | "owner" | "version";
};

export type ModuleRegistryV2Snapshot = {
  scannedAt: string;
  dashboard: RegistryDashboardMetrics;
  modules: EnterpriseModuleV2Descriptor[];
  dependencyGraph: DependencyGraphAnalysis;
  validation: RegistryValidationReport;
  featureFlags: RegistryFeatureFlagState[];
  versionMatrix: RegistryVersionEntry[];
  history: RegistryHistoryEntry[];
  selfRegistrationTargets: string[];
  pendingPublish: boolean;
  pendingRollback: string | null;
  draft: RegistryV2Document;
  live: RegistryV2Document;
};

export type ModuleRegistryV2Tab =
  | "dashboard"
  | "modules"
  | "dependencies"
  | "health"
  | "history"
  | "search";
