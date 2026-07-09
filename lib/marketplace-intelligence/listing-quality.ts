import type { Product } from "@/lib/products/types";
import { HomepageEligibility, type HomepageListingInput } from "@/lib/homepage/homepage-eligibility";
import { clampScore, type IntelligenceThresholds } from "@/lib/marketplace-intelligence/config";
import type { ListingQualityFactors, ListingQualityReport } from "@/lib/marketplace-intelligence/types";

function scoreImageCount(count: number): number {
  if (count >= 5) return 100;
  if (count >= 3) return 80;
  if (count >= 1) return 50;
  return 0;
}

function scoreDescriptionLength(length: number): number {
  if (length >= 200) return 100;
  if (length >= 80) return 75;
  if (length >= 30) return 50;
  return 20;
}

/** Listing Quality Engine — deterministic evaluation of every listing. */
export function evaluateListingQuality(
  input: HomepageListingInput & {
    id?: string;
    views?: number;
    likes?: number;
    description?: string | null;
    shippingMethod?: string | null;
    updatedAt?: string | null;
  },
  thresholds: IntelligenceThresholds,
): ListingQualityReport {
  const issues: string[] = [];
  const eligibility = HomepageEligibility.evaluate(input);

  const imageCount = input.imageCount ?? input.imageUrls?.length ?? (input.imageUrl ? 1 : 0);
  const descriptionLength = (input.description ?? "").trim().length;
  const hasCategory = Boolean(input.categoryId);
  const hasPrice = typeof input.price === "number" && input.price > 0;
  const hasShipping = Boolean(input.shippingMethod) || true;
  const updatedAt = input.updatedAt ? new Date(input.updatedAt).getTime() : Date.now();
  const freshnessDays = Math.floor((Date.now() - updatedAt) / (24 * 60 * 60 * 1000));
  const views = input.views ?? 0;

  const factors: ListingQualityFactors = {
    imageCount: scoreImageCount(imageCount),
    imageResolution: imageCount >= 2 ? 85 : 50,
    descriptionLength: scoreDescriptionLength(descriptionLength),
    requiredAttributes: hasCategory && hasPrice ? 100 : hasCategory || hasPrice ? 60 : 20,
    categoryAccuracy: hasCategory ? 90 : 0,
    priceCompleteness: hasPrice ? 100 : 0,
    shippingAvailability: hasShipping ? 90 : 40,
    freshness: freshnessDays <= 7 ? 100 : freshnessDays <= 30 ? 70 : 40,
    visibility: Math.min(100, views * 2),
  };

  if (imageCount < 1) issues.push("missing_images");
  if (descriptionLength < 30) issues.push("short_description");
  if (!hasCategory) issues.push("missing_category");
  if (!hasPrice) issues.push("missing_price");
  if (!eligibility.eligible && eligibility.reason) issues.push(eligibility.reason.toLowerCase());

  const completeness = clampScore(
    Object.values(factors).reduce((sum, value) => sum + value, 0) / Object.keys(factors).length,
  );

  const score = clampScore(completeness * 0.7 + (eligibility.eligible ? 30 : 0));

  return {
    listingId: input.id ?? input.slug,
    slug: input.slug,
    title: input.title,
    score,
    completeness,
    indexable: eligibility.eligible && score >= thresholds.minQualityScore,
    factors,
    issues,
  };
}

export function evaluateProductListingQuality(
  product: Product,
  thresholds: IntelligenceThresholds,
): ListingQualityReport {
  return evaluateListingQuality(
    {
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId ?? null,
      imageUrl: product.imageUrl,
      imageCount: product.imageCount ?? 1,
      status: "published",
      views: product.views,
      likes: product.likes,
      sellerVerified: product.sellerVerified,
      updatedAt: product.createdAt,
    },
    thresholds,
  );
}

export function averageListingQuality(reports: ListingQualityReport[]): number {
  if (!reports.length) return 0;
  return clampScore(reports.reduce((sum, report) => sum + report.score, 0) / reports.length);
}
