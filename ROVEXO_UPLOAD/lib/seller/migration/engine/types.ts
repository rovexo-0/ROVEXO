import type {
  DuplicateAction,
  MigrationImportMethodId,
  MigrationImportReport,
  MigrationLiveProgress,
  MigrationPlatformId,
} from "@/lib/seller/migration/types";
import type { ConnectorCapabilityFlags } from "@/lib/seller/migration/connectors/types";

export type MigrationConnectorInput = {
  sellerId: string;
  jobId: string;
  platform: MigrationPlatformId;
  importMethod: MigrationImportMethodId;
  payload?: MigrationInputPayload;
  offset: number;
  limit: number;
};

export type MigrationInputPayload = {
  urls?: string[];
  fileName?: string;
  fileContent?: string;
  fileEncoding?: "utf8" | "base64";
  fileStoragePath?: string;
  storeUrl?: string;
  apiCredentialsRef?: string;
};

export type MigrationRawListing = {
  externalId: string;
  title: string;
  description?: string;
  brand?: string;
  model?: string;
  variant?: string;
  condition?: string;
  price: number;
  currency?: string;
  colour?: string;
  size?: string;
  storage?: string;
  capacity?: string;
  sku?: string;
  ean?: string;
  upc?: string;
  quantity?: number;
  sourceCategory?: string;
  imageUrls?: string[];
  attributes?: Record<string, string | number | boolean>;
};

export type MigrationNormalizedListing = MigrationRawListing & {
  fingerprint: string;
  categorySlug?: string;
  categoryPath?: string[];
  processedImages: MigrationProcessedImage[];
  warnings: string[];
};

export type MigrationProcessedImage = {
  url: string;
  thumbnailUrl: string;
  mediumUrl?: string;
  largeUrl?: string;
  originalUrl?: string;
  storagePath?: string;
  contentHash?: string;
  sortOrder: number;
  optimized: boolean;
};

export type MigrationDuplicateMatch = {
  listing: MigrationNormalizedListing;
  existingProductId?: string;
  similarity: number;
  recommendedAction: DuplicateAction;
};

export type MigrationBatchResult = {
  processed: number;
  imported: number;
  skipped: number;
  duplicates: number;
  warnings: number;
  errors: number;
  images: number;
  published: number;
  imagesStored?: number;
  imagesFailed?: number;
  imagesDownloaded?: number;
  imagesOptimized?: number;
};

export type MigrationEngineContext = {
  sellerId: string;
  jobId: string;
  platform: MigrationPlatformId;
  importMethod: MigrationImportMethodId;
  duplicatePolicy: DuplicateAction;
  input?: MigrationInputPayload;
  batchSize: number;
  currentBatch: number;
  totalBatches: number;
  itemsTotal: number;
  progress: MigrationLiveProgress;
  report: MigrationImportReport;
  startedAt: string;
};

export type MigrationProviderCapabilities = {
  id: MigrationPlatformId;
  name: string;
  supportedMethods: MigrationImportMethodId[];
  integrationStatus: "ready" | "stub" | "api" | "file";
  capabilities: ConnectorCapabilityFlags;
};

export interface MigrationProvider {
  readonly capabilities: MigrationProviderCapabilities;
  connect(input: MigrationConnectorInput): Promise<void>;
  fetchListings(input: MigrationConnectorInput): Promise<MigrationRawListing[]>;
  estimateTotal(input: Omit<MigrationConnectorInput, "offset" | "limit">): Promise<number>;
}
