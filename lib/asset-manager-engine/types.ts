export type AssetLibraryId =
  | "logos"
  | "icons"
  | "svg"
  | "png"
  | "webp"
  | "jpg"
  | "avif"
  | "hero-banners"
  | "homepage-assets"
  | "category-images"
  | "listing-placeholders"
  | "product-placeholders"
  | "profile-images"
  | "business-images"
  | "premium-photography"
  | "background-images"
  | "wallpapers"
  | "illustrations"
  | "empty-state-graphics"
  | "stickers"
  | "emoji"
  | "flags"
  | "fonts"
  | "videos"
  | "audio"
  | "lottie-animations"
  | "brand-assets"
  | "marketing-assets"
  | "seasonal-assets";

export type AssetStatus = "draft" | "approved" | "published" | "archived";
export type AssetApprovalStatus = "pending" | "approved" | "rejected";
export type AssetUsageModule =
  | "homepage-hero"
  | "category-rail"
  | "search"
  | "profile"
  | "orders"
  | "wallet"
  | "notifications"
  | "messages"
  | "footer"
  | "header"
  | "emails"
  | "push-notifications"
  | "marketing"
  | "admin"
  | "api-documentation"
  | "listings"
  | "product-cards"
  | "mobile-navigation"
  | "desktop-navigation";

export type AssetLibraryDefinition = {
  id: AssetLibraryId;
  label: string;
  icon: string;
  description: string;
  formats: string[];
};

export type EnterpriseAssetRecord = {
  id: string;
  name: string;
  libraryId: AssetLibraryId;
  format: string;
  src: string;
  folder: string;
  tags: string[];
  description?: string;
  language?: string;
  country?: string;
  brand?: string;
  color?: string;
  resolution?: string;
  author?: string;
  version: number;
  status: AssetStatus;
  approvalStatus: AssetApprovalStatus;
  usageCount: number;
  bytes: number;
  width?: number;
  height?: number;
  orientation?: "landscape" | "portrait" | "square";
  favorite?: boolean;
  lastModified?: string;
};

export type AssetUsageEntry = {
  assetId: string;
  module: AssetUsageModule;
  location: string;
  href?: string;
};

export type AssetValidationIssue = {
  id: string;
  assetId: string;
  type:
    | "broken-reference"
    | "missing"
    | "duplicate"
    | "unused"
    | "oversized"
    | "wrong-dimensions"
    | "corrupted"
    | "missing-responsive";
  severity: "info" | "warning" | "critical";
  message: string;
};

export type AssetStorageStats = {
  totalAssets: number;
  storageUsedBytes: number;
  freeSpaceBytes: number;
  largestAssets: EnterpriseAssetRecord[];
  mostUsedAssets: EnterpriseAssetRecord[];
  unusedAssets: EnterpriseAssetRecord[];
  duplicateAssets: EnterpriseAssetRecord[];
  optimizationSavingsBytes: number;
  compressionRatio: number;
};

export type AssetBrandKit = {
  primaryLogo?: string;
  secondaryLogo?: string;
  darkLogo?: string;
  lightLogo?: string;
  favicon?: string;
  appIcon?: string;
  socialLogo?: string;
  brandColors: string[];
  typography: { heading?: string; body?: string };
  guidelines?: string;
};

export type AssetManagerEngineAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
  publishReference?: string;
};

export type AssetManagerEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: AssetManagerEngineDocument;
  rollbackAvailable: boolean;
};

export type AssetManagerEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  libraries: { id: AssetLibraryId; label: string; enabled: boolean }[];
  mediaManager: {
    upload: boolean;
    dragDrop: boolean;
    rename: boolean;
    replace: boolean;
    duplicate: boolean;
    move: boolean;
    copy: boolean;
    archive: boolean;
    restore: boolean;
    delete: boolean;
    restorePreviousVersion: boolean;
    clone: boolean;
    export: boolean;
    import: boolean;
    bulkUpload: boolean;
    bulkDelete: boolean;
    bulkReplace: boolean;
    bulkOptimize: boolean;
  };
  optimization: {
    webp: boolean;
    avif: boolean;
    responsiveSizes: boolean;
    thumbnail: boolean;
    tabletSize: boolean;
    desktopSize: boolean;
    retinaSize: boolean;
    compressedVersion: boolean;
    cdnReady: boolean;
  };
  validation: {
    brokenReferences: boolean;
    missingAssets: boolean;
    duplicateAssets: boolean;
    unusedAssets: boolean;
    oversizedFiles: boolean;
    wrongDimensions: boolean;
    corruptedFiles: boolean;
    missingResponsiveVariants: boolean;
  };
  security: {
    superAdminUpload: boolean;
    superAdminDelete: boolean;
    superAdminPublish: boolean;
    superAdminRollback: boolean;
    superAdminReplaceGlobal: boolean;
    superAdminBulkOps: boolean;
    auditProtected: boolean;
  };
  brandKit: AssetBrandKit;
  integrations: Record<string, boolean>;
  futureReady: string[];
  auditLog: AssetManagerEngineAuditEntry[];
};

export type AssetManagerEngineDashboard = {
  assetScore: number;
  totalAssets: number;
  publishedAssets: number;
  librariesEnabled: number;
  validationIssues: number;
  storageUsedMb: number;
};

export type AssetManagerEngineAnalytics = {
  imageLibraries: number;
  mediaLibraries: number;
  brandLibraries: number;
  optimizationEnabled: number;
  validationEnabled: number;
  securityFeatures: number;
};

export type AssetManagerEngineSnapshot = {
  scannedAt: string;
  libraries: AssetLibraryDefinition[];
  assets: EnterpriseAssetRecord[];
  usage: AssetUsageEntry[];
  validation: AssetValidationIssue[];
  storage: AssetStorageStats;
  draft: AssetManagerEngineDocument;
  live: AssetManagerEngineDocument;
  history: AssetManagerEngineHistoryEntry[];
};

export type AssetSearchFilters = {
  query?: string;
  tag?: string;
  fileType?: string;
  libraryId?: AssetLibraryId;
  status?: AssetStatus;
  author?: string;
  module?: AssetUsageModule;
  color?: string;
  orientation?: EnterpriseAssetRecord["orientation"];
  minBytes?: number;
  maxBytes?: number;
};
