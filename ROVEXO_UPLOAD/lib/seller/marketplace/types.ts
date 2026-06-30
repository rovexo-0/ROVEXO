import type { ConnectorCapabilityFlags } from "@/lib/seller/migration/connectors/types";
import type { MigrationImportMethodId, MigrationPlatformId } from "@/lib/seller/migration/types";

export type MarketplaceAuthenticationType =
  | "oauth"
  | "oauth2"
  | "api_key"
  | "bearer_token"
  | "username_password"
  | "manual_import"
  | "csv"
  | "xml"
  | "xlsx"
  | "file_upload"
  | "none";

export type MarketplaceHealthStatus =
  | "healthy"
  | "warning"
  | "offline"
  | "authentication_expired"
  | "rate_limited"
  | "maintenance";

export type MarketplaceSyncStatus =
  | "connected"
  | "disconnected"
  | "synchronizing"
  | "importing"
  | "publishing"
  | "completed"
  | "warning"
  | "error"
  | "retry_available";

export type MarketplaceProviderStatus = "available" | "connected" | "disconnected" | "disabled";

export type MarketplaceCapabilityFlags = ConnectorCapabilityFlags & {
  urlImport: boolean;
  csvImport: boolean;
  xmlImport: boolean;
  xlsxImport: boolean;
  duplicateDetection: boolean;
  productSync: boolean;
  reports: boolean;
};

export type MarketplaceProviderRegistryEntry = {
  id: MigrationPlatformId;
  name: string;
  logo: string;
  description: string;
  version: string;
  status: MarketplaceProviderStatus;
  capabilities: MarketplaceCapabilityFlags;
  authenticationType: MarketplaceAuthenticationType;
  importMethods: MigrationImportMethodId[];
  supportedFeatures: string[];
  integrationStatus: "ready" | "stub" | "api" | "file";
};

export type MarketplaceProviderView = MarketplaceProviderRegistryEntry & {
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  healthStatus: MarketplaceHealthStatus;
  syncStatus: MarketplaceSyncStatus;
  enabled: boolean;
  lastSyncAt: string | null;
  lastHealthCheckAt: string | null;
  lastError: string | null;
  retryAvailable: boolean;
};

export type MarketplaceManagerSummary = {
  providers: MarketplaceProviderView[];
  totalProviders: number;
  connectedCount: number;
  healthyCount: number;
  warningCount: number;
};

export type MarketplaceAnalyticsSnapshot = {
  imports: number;
  errors: number;
  averageSyncMs: number;
  lastImportAt: string | null;
};

export type MarketplaceSettingsAction =
  | "enable"
  | "disable"
  | "reconnect"
  | "disconnect"
  | "reset"
  | "delete_credentials"
  | "health_check"
  | "retry";
