export type EnterpriseModuleCategory = "core" | "commerce" | "platform" | "insights" | "operations";

export type EnterpriseModuleRoute = {
  id: string;
  label: string;
  href: string;
};

export type EnterpriseFeatureFlag = {
  id: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
};

export type EnterpriseModulePermission = {
  action: string;
  label: string;
  requiresMfa?: boolean;
  requiresBiometric?: boolean;
  roles: Array<"super-admin">;
};

export type EnterpriseModuleApiPaths = {
  /** Unversioned path — preserved for backward compatibility */
  snapshot: string;
  action: string;
  /** Version-ready paths */
  v1Snapshot: string;
  v1Action: string;
};

export type EnterpriseModuleConfigKeys = {
  draft: string;
  live: string;
  history: string;
  settings: string;
  [key: string]: string;
};

export type EnterpriseModuleDescriptor = {
  id: string;
  label: string;
  icon: string;
  description: string;
  category: EnterpriseModuleCategory;
  version: string;
  autoRegister: boolean;
  baseHref: string;
  routes: readonly EnterpriseModuleRoute[];
  api: EnterpriseModuleApiPaths;
  featureFlags: readonly EnterpriseFeatureFlag[];
  permissions: readonly EnterpriseModulePermission[];
  configKeys: EnterpriseModuleConfigKeys;
  relatedModules?: readonly string[];
};

export type EnterpriseConfigAuditEntry = {
  id: string;
  administrator: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
  timestamp: string;
};

export type EnterpriseConfigHistoryEntry<TDocument> = {
  id: string;
  publishedAt: string;
  publishedBy: string;
  label: string;
  bundle: TDocument;
  rollbackAvailable: boolean;
};

export type EnterpriseConfigDocument<TSettings, TFeatureFlags extends Record<string, boolean>> = {
  label: "Draft" | "Live";
  version: string;
  updatedAt: string;
  featureFlags: TFeatureFlags;
  settings: TSettings;
  auditLog: EnterpriseConfigAuditEntry[];
};
