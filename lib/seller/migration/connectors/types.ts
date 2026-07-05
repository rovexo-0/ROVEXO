import type {
  MigrationConnectorInput,
  MigrationNormalizedListing,
  MigrationProcessedImage,
  MigrationProvider,
  MigrationRawListing,
} from "@/lib/seller/migration/engine/types";
import type {
  MigrationImportMethodId,
  MigrationPlatformId,
  ValidationIssue,
} from "@/lib/seller/migration/types";

export type ConnectorConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type ConnectorIntegrationStatus = "ready" | "stub" | "api" | "file";

/** Capability flags — only enable what the connector actually supports. */
export type ConnectorCapabilityFlags = {
  authentication: boolean;
  apiImport: boolean;
  fileImport: boolean;
  bulkImport: boolean;
  bulkPublish: boolean;
  categoryMapping: boolean;
  imageImport: boolean;
  inventorySync: boolean;
  priceSync: boolean;
  orderSync: boolean;
  statusSync: boolean;
};

export type ConnectorConnectInput = {
  sellerId: string;
  platform: MigrationPlatformId;
  storeUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  fileName?: string;
  fileContent?: string;
  expiresAt?: string;
  scopes?: string;
  connectedAt?: string;
  settings?: Record<string, string | boolean | number>;
};

export type ConnectorValidationResult = {
  valid: boolean;
  errors: ValidationIssue[];
};

export type ConnectorRuntimeStatus = {
  platform: MigrationPlatformId;
  name: string;
  connectionStatus: ConnectorConnectionStatus;
  integrationStatus: ConnectorIntegrationStatus;
  capabilities: ConnectorCapabilityFlags;
  supportedMethods: MigrationImportMethodId[];
  lastSyncAt: string | null;
  lastError: string | null;
};

export type ConnectorImportContext = {
  cancelled: boolean;
};

export type ConnectorDefinition = {
  id: MigrationPlatformId;
  name: string;
  integrationStatus: ConnectorIntegrationStatus;
  supportedMethods: readonly MigrationImportMethodId[];
  capabilities: ConnectorCapabilityFlags;
  implementation: "stub" | "file_csv" | "file_xlsx" | "file_xml" | "api_shopify" | "api_woocommerce" | "api_ebay" | "api_etsy";
};

/**
 * Universal connector contract — every marketplace plugs into this interface.
 * Business logic stays inside the connector; ROVEXO pipelines orchestrate only.
 */
export interface UniversalConnector {
  readonly definition: ConnectorDefinition;

  connect(input: ConnectorConnectInput): Promise<void>;
  disconnect(sellerId: string): Promise<void>;
  validateConfiguration(input: ConnectorConnectInput): Promise<ConnectorValidationResult>;

  estimateTotal(input: Omit<MigrationConnectorInput, "offset" | "limit">): Promise<number>;
  fetchListings(input: MigrationConnectorInput): Promise<MigrationRawListing[]>;
  cancelImport(jobId: string, sellerId: string): Promise<void>;

  validateListing(raw: MigrationRawListing): ConnectorValidationResult;
  normalizeListing(raw: MigrationRawListing): MigrationNormalizedListing;
  downloadImages(listing: MigrationRawListing): Promise<MigrationProcessedImage[]>;
  mapCategories(
    listing: MigrationNormalizedListing,
    sellerId: string,
    platform: MigrationPlatformId,
  ): Promise<MigrationNormalizedListing>;

  generateReport(jobId: string, sellerId: string): Promise<Record<string, unknown>>;
  getStatus(sellerId: string): Promise<ConnectorRuntimeStatus>;

  /** Backward-compatible adapter for Module 2 migration engine. */
  asMigrationProvider(): MigrationProvider;
}
