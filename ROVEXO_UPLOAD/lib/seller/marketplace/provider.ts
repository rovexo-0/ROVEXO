import "server-only";

import type { ConnectorConnectInput, ConnectorValidationResult, UniversalConnector } from "@/lib/seller/migration/connectors/types";
import type { MigrationConnectorInput, MigrationNormalizedListing, MigrationProcessedImage, MigrationRawListing } from "@/lib/seller/migration/engine/types";
import { getMarketplaceRegistryEntry } from "@/lib/seller/marketplace/registry";
import type { MarketplaceHealthStatus, MarketplaceProviderRegistryEntry, MarketplaceSyncStatus } from "@/lib/seller/marketplace/types";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export interface MarketplaceProvider {
  readonly registry: MarketplaceProviderRegistryEntry;

  connect(input: ConnectorConnectInput): Promise<void>;
  disconnect(sellerId: string): Promise<void>;
  validate(input: ConnectorConnectInput): Promise<ConnectorValidationResult>;
  health(sellerId: string): Promise<MarketplaceHealthStatus>;
  status(sellerId: string): Promise<MarketplaceSyncStatus>;
  authenticate(input: ConnectorConnectInput): Promise<void>;

  importSingle(input: MigrationConnectorInput): Promise<MigrationRawListing[]>;
  importBulk(input: MigrationConnectorInput): Promise<MigrationRawListing[]>;
  importStore(input: MigrationConnectorInput): Promise<MigrationRawListing[]>;

  normalize(raw: MigrationRawListing): MigrationNormalizedListing;
  validateListing(raw: MigrationRawListing): ConnectorValidationResult;
  downloadImages(listing: MigrationRawListing): Promise<MigrationProcessedImage[]>;
  mapCategories(
    listing: MigrationNormalizedListing,
    sellerId: string,
    platform: MigrationPlatformId,
  ): Promise<MigrationNormalizedListing>;
  generateReport(jobId: string, sellerId: string): Promise<Record<string, unknown>>;

  cancel(jobId: string, sellerId: string): Promise<void>;
  resume(_sellerId: string, _platform: MigrationPlatformId): Promise<void>;
  retry(sellerId: string, platform: MigrationPlatformId): Promise<MarketplaceHealthStatus>;
}

export function createMarketplaceProvider(connector: UniversalConnector): MarketplaceProvider {
  const registry = getMarketplaceRegistryEntry(connector.definition.id);

  return {
    registry,

    connect: (input) => connector.connect(input),
    disconnect: (sellerId) => connector.disconnect(sellerId),
    validate: (input) => connector.validateConfiguration(input),
    health: async (sellerId) => {
      const { checkMarketplaceHealth } = await import("@/lib/seller/marketplace/health");
      return checkMarketplaceHealth(sellerId, connector.definition.id);
    },
    status: async (sellerId) => {
      const { resolveMarketplaceSyncStatus } = await import("@/lib/seller/marketplace/status");
      return resolveMarketplaceSyncStatus(sellerId, connector.definition.id);
    },
    authenticate: (input) => connector.connect(input),

    importSingle: (input) => connector.fetchListings({ ...input, limit: 1, offset: 0 }),
    importBulk: (input) => connector.fetchListings(input),
    importStore: (input) => connector.fetchListings(input),

    normalize: (raw) => connector.normalizeListing(raw),
    validateListing: (raw) => connector.validateListing(raw),
    downloadImages: (listing) => connector.downloadImages(listing),
    mapCategories: (listing, sellerId, platform) =>
      connector.mapCategories(listing, sellerId, platform),
    generateReport: (jobId, sellerId) => connector.generateReport(jobId, sellerId),

    cancel: (jobId, sellerId) => connector.cancelImport(jobId, sellerId),
    resume: async () => undefined,
    retry: async (sellerId, platform) => {
      const { retryMarketplaceConnection } = await import("@/lib/seller/marketplace/retry");
      return retryMarketplaceConnection(sellerId, platform);
    },
  };
}
