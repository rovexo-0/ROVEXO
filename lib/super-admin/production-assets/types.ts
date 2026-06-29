export type ValidationIssueSeverity = "error" | "warning";

export type ValidationIssueCode =
  | "placeholder-filename"
  | "forbidden-svg"
  | "missing-asset"
  | "undersized-asset"
  | "broken-manifest"
  | "stale-asset"
  | "legacy-directory"
  | "external-url-reference";

export type ValidationIssue = {
  code: ValidationIssueCode;
  severity: ValidationIssueSeverity;
  path: string;
  message: string;
  section: ProductionAssetSection;
};

export type ProductionAssetSection =
  | "category-rail"
  | "homepage-categories"
  | "hero-campaigns"
  | "banners"
  | "promotions"
  | "empty-states"
  | "feature-cards"
  | "business-spotlight"
  | "continue-browsing"
  | "featured-listings"
  | "recommended"
  | "recently-listed"
  | "auctions"
  | "sources";

export type ProductionAssetValidationReport = {
  validatedAt: string;
  status: "passed" | "failed";
  deploymentReady: boolean;
  summary: {
    totalAssets: number;
    premiumAssets: number;
    placeholderAssets: number;
    missingAssets: number;
    brokenAssets: number;
    staleAssets: number;
  };
  formats: {
    avif: number;
    webp: number;
    png: number;
    svg: number;
  };
  responsiveImages: {
    category: boolean;
    hero: boolean;
  };
  sections: Record<
    ProductionAssetSection,
    {
      label: string;
      status: "passed" | "failed" | "skipped";
      assetCount: number;
    }
  >;
  issues: ValidationIssue[];
};

export type ProductionAssetActionResult = {
  ok: boolean;
  message: string;
  output?: string;
  report?: ProductionAssetValidationReport;
};

export const PRODUCTION_ASSET_SECTION_LABELS: Record<ProductionAssetSection, string> = {
  "category-rail": "Category Rail Icons",
  "homepage-categories": "Homepage Categories",
  "hero-campaigns": "Hero Campaign Images",
  banners: "Banner Images",
  promotions: "Promotion Graphics",
  "empty-states": "Empty State Illustrations",
  "feature-cards": "Feature Cards",
  "business-spotlight": "Business Spotlight",
  "continue-browsing": "Continue Browsing",
  "featured-listings": "Featured Listings",
  recommended: "Recommended",
  "recently-listed": "Recently Listed",
  auctions: "Auctions",
  sources: "Photography Source Masters",
};
