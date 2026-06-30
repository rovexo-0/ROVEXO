export type MigrationPlatformId =
  | "facebook_marketplace"
  | "ebay"
  | "amazon"
  | "etsy"
  | "vinted"
  | "depop"
  | "shopify"
  | "woocommerce"
  | "magento"
  | "bigcommerce"
  | "opencart"
  | "prestashop"
  | "wix_stores"
  | "squarespace"
  | "gumtree"
  | "craigslist"
  | "mercari"
  | "offerup"
  | "olx"
  | "wallapop"
  | "kleinanzeigen"
  | "leboncoin"
  | "marktplaats"
  | "allegro"
  | "subito"
  | "kijiji"
  | "csv"
  | "xlsx"
  | "xml"
  | "other";

export type MigrationImportMethodId =
  | "single_url"
  | "multiple_urls"
  | "bulk_import"
  | "store_import"
  | "csv"
  | "xlsx"
  | "xml"
  | "api_import";

export type MigrationJobStatus =
  | "draft"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type DuplicateAction = "skip" | "replace" | "update" | "create_new";

/** Legacy stats — preserved for Module 1 API compatibility. */
export type MigrationJobStats = {
  imported: number;
  ready: number;
  warnings: number;
  completed: number;
};

export type MigrationLiveProgress = {
  listingsFound: number;
  imported: number;
  images: number;
  categories: number;
  publishing: number;
  speedPerMinute: number;
  remaining: number;
  etaSeconds: number;
  completed: number;
  currentBatch: number;
  totalBatches: number;
  imagesDownloaded?: number;
  imagesStored?: number;
  imagesOptimized?: number;
  imagesRemaining?: number;
};

export type MigrationImportReport = {
  imported: number;
  published: number;
  skipped: number;
  duplicates: number;
  warnings: number;
  errors: number;
  durationSeconds: number;
  images: number;
  imagesStored?: number;
  imagesFailed?: number;
  imagesDownloaded?: number;
  imagesOptimized?: number;
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

export type MigrationJob = {
  id: string;
  sellerId: string;
  platform: MigrationPlatformId;
  importMethod: MigrationImportMethodId;
  status: MigrationJobStatus;
  progressPercent: number;
  estimatedSeconds: number | null;
  stats: MigrationJobStats;
  progress: MigrationLiveProgress | null;
  report: MigrationImportReport | null;
  duplicatePolicy: DuplicateAction;
  input: MigrationInputPayload | null;
  itemsTotal: number;
  currentBatch: number;
  totalBatches: number;
  notifyOnComplete: boolean;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  publishStatus: PublishJobStatus;
  publishProgress: MigrationPublishProgress | null;
  publishReport: MigrationFinalReport | null;
  autoPublish: boolean;
  scheduledPublishAt: string | null;
  publishBatch: number;
  publishTotalBatches: number;
};

export type CreateMigrationJobInput = {
  sellerId: string;
  platform: MigrationPlatformId;
  importMethod: MigrationImportMethodId;
  duplicatePolicy?: DuplicateAction;
  input?: MigrationInputPayload;
  notifyOnComplete?: boolean;
  autoPublish?: boolean;
};

export type MigrationPreviewItem = {
  id: string;
  title: string;
  price: string;
  imageLabel: string;
  status: "ready" | "warning";
  note?: string;
};

export type MigrationWizardStep = 1 | 2 | 3 | 4 | 5;

export type PublishJobStatus = "idle" | "queued" | "publishing" | "completed" | "failed" | "cancelled";

export type PublishItemStatus = "pending" | "draft" | "published" | "failed" | "skipped" | "cancelled";

export type ValidationStatus = "pending" | "valid" | "warning" | "invalid";

export type PublishAction =
  | "publish_all"
  | "publish_selected"
  | "save_all_draft"
  | "schedule_publish"
  | "retry_failed"
  | "cancel_pending"
  | "delete_drafts";

export type ValidationIssue = {
  field: string;
  message: string;
};

export type MigrationPublishProgress = {
  listingsFound: number;
  imported: number;
  validated: number;
  imagesProcessed: number;
  categoriesMapped: number;
  publishing: number;
  published: number;
  skipped: number;
  warnings: number;
  errors: number;
  speedPerMinute: number;
  remaining: number;
  etaSeconds: number;
  progressPercent: number;
  currentBatch: number;
  totalBatches: number;
};

export type MigrationFinalReport = MigrationImportReport & {
  drafts: number;
  categories: number;
  successRate: number;
  processingTimeSeconds: number;
};

export type MigrationQueueItem = {
  id: string;
  jobId: string;
  sellerId: string;
  batchIndex: number;
  itemIndex: number;
  status: string;
  fingerprint: string | null;
  duplicateAction: DuplicateAction | null;
  existingProductId: string | null;
  productId: string | null;
  validationStatus: ValidationStatus;
  validationErrors: ValidationIssue[];
  suggestedCategorySlug: string | null;
  publishStatus: PublishItemStatus;
  selected: boolean;
  warnings: string[];
  normalizedData: Record<string, unknown> | null;
  title: string;
  price: number;
};

export type SellerMigrationSummary = {
  recentJobs: Array<{
    id: string;
    platform: MigrationPlatformId;
    status: MigrationJobStatus;
    publishStatus: PublishJobStatus;
    imported: number;
    published: number;
    warnings: number;
    createdAt: string;
  }>;
  latestImportStatus: MigrationJobStatus | null;
  lastPublishStatus: PublishJobStatus | null;
  failedPublishCount: number;
};
