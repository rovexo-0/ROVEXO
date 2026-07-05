import { DEMO_EMAIL_DOMAIN } from "@/lib/demo-environment/config";
import {
  isExternalPlaceholderImageUrl,
  resolveOfficialDemoProductImage,
} from "@/lib/media/official-demo-images";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";
import type { Product } from "@/lib/products/types";
import {
  isClosedBetaHomepageMode,
  isHomepageEligibilityLoggingEnabled,
  parseApprovedTesterEmails,
  resolveHomepageMode,
  type HomepageMode,
} from "@/lib/homepage/config";

/** Certified closed-beta demo seed slug: demo-seller01-001 */
export const APPROVED_DEMO_SLUG_PATTERN = /^demo-(?:buyer|seller|business)\d{2}-\d{3}$/;

export type HomepageExclusionReason =
  | "NOT_PUBLISHED"
  | "DRAFT"
  | "ARCHIVED"
  | "DELETED"
  | "SUSPENDED"
  | "NO_IMAGES"
  | "PLACEHOLDER_IMAGE"
  | "INVALID_TITLE"
  | "INVALID_DESCRIPTION"
  | "INVALID_CATEGORY"
  | "INVALID_PRICE"
  | "SELLER_INACTIVE"
  | "SELLER_BANNED"
  | "SELLER_EMAIL_UNVERIFIED"
  | "MARKETPLACE_NOT_APPROVED"
  | "DEMO_NOT_ALLOWED"
  | "NOT_APPROVED_FOR_CLOSED_BETA";

export type HomepageListingInput = {
  status: string;
  slug: string;
  title: string;
  description?: string | null;
  price?: number | null;
  categoryId?: string | null;
  moderationStatus?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  imageCount?: number;
  sellerEmail?: string | null;
  sellerUsername?: string | null;
  sellerVerified?: boolean;
  sellerAccountStatus?: string | null;
  sellerRole?: string | null;
};

export type HomepageEligibilityResult = {
  eligible: boolean;
  reason?: HomepageExclusionReason;
  mode: HomepageMode;
};

const INTERNAL_PLATFORM_ROLES = new Set(["admin", "super_admin"]);

const LOREM_PATTERN = /lorem ipsum|dolor sit amet/i;

let lastExclusionLog: Array<{ slug: string; reason: HomepageExclusionReason }> = [];

export function getRecentHomepageExclusions(limit = 50): Array<{ slug: string; reason: HomepageExclusionReason }> {
  return lastExclusionLog.slice(0, limit);
}

function recordExclusion(slug: string, reason: HomepageExclusionReason): void {
  lastExclusionLog = [{ slug, reason }, ...lastExclusionLog.filter((entry) => entry.slug !== slug)].slice(
    0,
    200,
  );
  if (isHomepageEligibilityLoggingEnabled()) {
    console.info(`[homepage-eligibility] ${slug} excluded: ${reason}`);
  }
}

function hasValidImage(input: HomepageListingInput): boolean {
  const urls = [
    ...(input.imageUrls ?? []),
    ...(input.imageUrl ? [input.imageUrl] : []),
  ].filter(Boolean) as string[];

  if (!urls.length && (input.imageCount ?? 0) < 1) {
    return false;
  }

  const candidates = urls.length ? urls : [resolveOfficialDemoProductImage(input.slug)];
  return candidates.some(
    (url) =>
      url &&
      url !== PRODUCT_IMAGE_FALLBACK &&
      !isExternalPlaceholderImageUrl(url),
  );
}

function isApprovedDemoListing(input: HomepageListingInput): boolean {
  const email = input.sellerEmail?.toLowerCase() ?? "";
  return (
    APPROVED_DEMO_SLUG_PATTERN.test(input.slug) &&
    email.endsWith(`@${DEMO_EMAIL_DOMAIN}`)
  );
}

function isApprovedTesterListing(input: HomepageListingInput): boolean {
  const email = input.sellerEmail?.toLowerCase() ?? "";
  if (!email) return false;
  return parseApprovedTesterEmails().has(email);
}

function isInternalPlatformSeller(input: HomepageListingInput): boolean {
  const role = input.sellerRole?.toLowerCase() ?? "";
  return INTERNAL_PLATFORM_ROLES.has(role);
}

/** Published listings with moderation warnings remain visible; only pending/blocked are hidden. */
function isMarketplaceModerationVisible(status: string | null | undefined): boolean {
  if (!status) return true;
  return status === "approved" || status === "warning";
}

/** Must stay aligned with sell publish validation (`features/sell/types.ts`). */
const MIN_HOMEPAGE_TITLE_LENGTH = 3;
const MIN_HOMEPAGE_DESCRIPTION_LENGTH = 10;

function evaluateCoreEligibility(input: HomepageListingInput): HomepageEligibilityResult {
  const mode = resolveHomepageMode();

  if (input.status === "draft") {
    return { eligible: false, reason: "DRAFT", mode };
  }
  if (input.status === "archived") {
    return { eligible: false, reason: "ARCHIVED", mode };
  }
  if (input.status === "deleted") {
    return { eligible: false, reason: "DELETED", mode };
  }
  if (input.status === "suspended" || input.status === "paused") {
    return { eligible: false, reason: "SUSPENDED", mode };
  }
  if (input.status !== "published") {
    return { eligible: false, reason: "NOT_PUBLISHED", mode };
  }

  if (!input.title || input.title.trim().length < MIN_HOMEPAGE_TITLE_LENGTH) {
    return { eligible: false, reason: "INVALID_TITLE", mode };
  }
  if (!input.description || input.description.trim().length < MIN_HOMEPAGE_DESCRIPTION_LENGTH) {
    return { eligible: false, reason: "INVALID_DESCRIPTION", mode };
  }
  if (LOREM_PATTERN.test(input.description)) {
    return { eligible: false, reason: "INVALID_DESCRIPTION", mode };
  }
  if (!input.categoryId) {
    return { eligible: false, reason: "INVALID_CATEGORY", mode };
  }
  if (!input.price || input.price <= 0) {
    return { eligible: false, reason: "INVALID_PRICE", mode };
  }

  if (input.sellerAccountStatus === "banned") {
    return { eligible: false, reason: "SELLER_BANNED", mode };
  }
  if (input.sellerAccountStatus && input.sellerAccountStatus !== "active") {
    return { eligible: false, reason: "SELLER_INACTIVE", mode };
  }
  if (!input.sellerVerified) {
    return { eligible: false, reason: "SELLER_EMAIL_UNVERIFIED", mode };
  }
  if (!isMarketplaceModerationVisible(input.moderationStatus)) {
    return { eligible: false, reason: "MARKETPLACE_NOT_APPROVED", mode };
  }

  if (!hasValidImage(input)) {
    const urls = [input.imageUrl, ...(input.imageUrls ?? [])].filter(Boolean) as string[];
    if (urls.some((url) => isExternalPlaceholderImageUrl(url))) {
      return { eligible: false, reason: "PLACEHOLDER_IMAGE", mode };
    }
    return { eligible: false, reason: "NO_IMAGES", mode };
  }

  if (mode === "closed_beta") {
    if (isApprovedDemoListing(input) || isApprovedTesterListing(input)) {
      return { eligible: true, mode };
    }
    return { eligible: false, reason: "NOT_APPROVED_FOR_CLOSED_BETA", mode };
  }

  if (isApprovedDemoListing(input)) {
    return { eligible: false, reason: "DEMO_NOT_ALLOWED", mode };
  }
  if (isInternalPlatformSeller(input)) {
    return { eligible: false, reason: "MARKETPLACE_NOT_APPROVED", mode };
  }

  return { eligible: true, mode };
}

export const HomepageEligibility = {
  isEligible(input: HomepageListingInput): boolean {
    const result = evaluateCoreEligibility(input);
    if (!result.eligible && result.reason) {
      recordExclusion(input.slug, result.reason);
    }
    return result.eligible;
  },

  evaluate(input: HomepageListingInput): HomepageEligibilityResult {
    const result = evaluateCoreEligibility(input);
    if (!result.eligible && result.reason) {
      recordExclusion(input.slug, result.reason);
    }
    return result;
  },

  getExclusionReason(input: HomepageListingInput): HomepageExclusionReason | null {
    return HomepageEligibility.evaluate(input).reason ?? null;
  },

  fromProduct(product: Product): HomepageListingInput {
    return {
      status: "published",
      slug: product.slug,
      title: product.title,
      description: product.description ?? null,
      price: product.price,
      categoryId: product.categoryId ?? null,
      moderationStatus: product.moderationStatus ?? null,
      imageUrl: product.imageUrl,
      imageCount: product.imageCount,
      sellerEmail: product.sellerEmail ?? null,
      sellerUsername: product.sellerUsername ?? null,
      sellerVerified: product.sellerVerified ?? false,
      sellerAccountStatus: product.sellerAccountStatus ?? null,
      sellerRole: product.sellerRole ?? null,
    };
  },

  fromRow(row: {
    slug: string;
    title: string;
    description: string | null;
    status: string;
    price: number;
    category_id: string | null;
    moderation_status: string | null;
    profiles: {
      email: string | null;
      username: string | null;
      verified: boolean | null;
      account_status: string | null;
      role: string | null;
    } | null;
    product_images: Array<{ url?: string | null; thumbnail_url?: string | null }> | null;
  }): HomepageListingInput {
    const images = (row.product_images ?? [])
      .map((image) => image.thumbnail_url ?? image.url)
      .filter(Boolean) as string[];

    return {
      status: row.status,
      slug: row.slug,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      categoryId: row.category_id,
      moderationStatus: row.moderation_status,
      imageUrls: images,
      imageUrl: images[0] ?? null,
      imageCount: images.length,
      sellerEmail: row.profiles?.email ?? null,
      sellerUsername: row.profiles?.username ?? null,
      sellerVerified: row.profiles?.verified ?? false,
      sellerAccountStatus: row.profiles?.account_status ?? null,
      sellerRole: row.profiles?.role ?? null,
    };
  },

  filterProducts<T extends Product>(products: T[]): T[] {
    return products.filter((product) => HomepageEligibility.isEligible(HomepageEligibility.fromProduct(product)));
  },
};

export { isClosedBetaHomepageMode, resolveHomepageMode };

/** @deprecated Use HomepageEligibility.filterProducts */
export function filterHomepageProducts<T extends Product>(products: T[]): T[] {
  return HomepageEligibility.filterProducts(products);
}
