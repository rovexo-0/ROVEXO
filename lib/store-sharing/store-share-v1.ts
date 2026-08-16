/**
 * ROVEXO Canonical Store Sharing Engine v1.0
 *
 * ONE store URL · ONE share payload · ONE OG preview · ZERO AI · ZERO duplicates.
 * Destination is the seller's public store (Listings tab), never a single listing.
 */

import { PRODUCTION_ORIGIN } from "@/lib/preview/owner-preview-ssot";

export const STORE_SHARE_ENGINE_V1 = "store-share-v1.0" as const;

/** Public Store Share origin — production only. Never localhost or the current host. */
export const STORE_SHARE_PRODUCTION_ORIGIN = PRODUCTION_ORIGIN;

export const STORE_SHARE_PRODUCTION_URL_PREFIX = `${PRODUCTION_ORIGIN}/@` as const;

const STORE_SHARE_FORBIDDEN_HOST_MARKERS = [
  "localhost",
  "127.0.0.1",
  "192.168.",
  "10.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
] as const;

export const STORE_HANDLE_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export type StoreShareData = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  verified: boolean;
  rating: number | null;
  reviewCount: number;
  followersCount: number;
  followingCount: number;
  activeListingsCount: number;
  storeUrl: string;
};

export const STORE_SHARE_COPY = {
  cta: "Share Store",
  sheetTitle: (displayName: string) => `Share ${displayName}'s Store`,
  sheetDescription: "Anyone with this link will see the active listings on ROVEXO.",
  promoLine: "Buy • Sell • Grow on ROVEXO",
  supporting: "Discover unique items from independent sellers.",
  viewStore: "VIEW STORE",
  newSeller: "New seller",
  copied: "Store link copied",
  instagramHint: "Store message copied — paste in Instagram",
  buy: "Discover unique products.",
  sell: "Turn your items into sales.",
  grow: "Build your store on ROVEXO.",
} as const;

export const STORE_SHARE_MESSAGE = {
  line1: "Check out my store on ROVEXO!",
  line2: "Discover unique items and shop directly from my store.",
  line3: "Buy • Sell • Grow on ROVEXO 🚀",
} as const;

export type StoreShareChannel =
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "messenger"
  | "telegram"
  | "copy_link"
  | "qr"
  | "more"
  | "native";

export type StoreShareAnalyticsEvent =
  | "store_share_opened"
  | "store_share_native"
  | "store_share_copy_link"
  | "store_share_whatsapp"
  | "store_share_facebook"
  | "store_share_instagram"
  | "store_share_messenger"
  | "store_share_telegram"
  | "store_share_qr"
  | "store_store_visit";

export function normalizeStoreUsername(username: string): string {
  return username.trim().replace(/^@+/, "");
}

export function isValidStoreUsername(username: string): boolean {
  return STORE_HANDLE_PATTERN.test(normalizeStoreUsername(username));
}

export function buildStorePath(username: string): string {
  const handle = normalizeStoreUsername(username);
  if (!isValidStoreUsername(handle)) {
    throw new Error("STORE_SHARE_INVALID_USERNAME");
  }
  return `/@${handle}`;
}

export function storeShareUrlContainsForbiddenHost(url: string): boolean {
  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return true;
  }

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) {
    return true;
  }
  if (hostname.startsWith("192.168.") || hostname.startsWith("10.")) {
    return true;
  }
  const private172 = hostname.match(/^172\.(\d+)\./);
  if (private172) {
    const octet = Number(private172[1]);
    if (octet >= 16 && octet <= 31) return true;
  }

  const lower = url.toLowerCase();
  return STORE_SHARE_FORBIDDEN_HOST_MARKERS.some((marker) => {
    if (marker === "10.") {
      return /(?:^|\/\/)10\./.test(lower);
    }
    return lower.includes(marker);
  });
}

export function assertStoreShareProductionUrl(url: string): string {
  if (!url.startsWith(STORE_SHARE_PRODUCTION_URL_PREFIX)) {
    throw new Error("STORE_SHARE_NON_PRODUCTION_URL");
  }
  if (storeShareUrlContainsForbiddenHost(url)) {
    throw new Error("STORE_SHARE_LOCALHOST_URL");
  }
  return url;
}

/** Canonical public Store Share URL. Always https://www.rovexo.co.uk/@username. */
export function buildStoreUrl(username: string): string {
  return assertStoreShareProductionUrl(`${PRODUCTION_ORIGIN}${buildStorePath(username)}`);
}

export function parseStoreHandlePath(pathname: string): string | null {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    decoded = pathname;
  }
  const match = decoded.match(/^\/@([A-Za-z0-9._-]{1,64})$/);
  return match?.[1] ?? null;
}

/** Rewrite `/@username` → existing public profile `/user/username` (one implementation). */
export function resolveStoreHandleRewrite(pathname: string): string | null {
  const handle = parseStoreHandlePath(pathname);
  if (!handle) return null;
  return `/user/${handle}`;
}

export function buildStoreShareText(storeUrl: string): string {
  assertStoreShareProductionUrl(storeUrl);
  return [
    STORE_SHARE_MESSAGE.line1,
    STORE_SHARE_MESSAGE.line2,
    STORE_SHARE_MESSAGE.line3,
    storeUrl,
  ].join("\n");
}

export function buildStoreShareNativePayload(data: StoreShareData): {
  title: string;
  text: string;
  url: string;
} {
  return {
    title: `${data.displayName}'s Store on ROVEXO`,
    text: `Check out my store on ROVEXO! Buy • Sell • Grow on ROVEXO.`,
    url: data.storeUrl,
  };
}

export function formatStoreShareRatingLabel(data: Pick<StoreShareData, "rating" | "reviewCount">): string {
  const reviews = Math.max(0, data.reviewCount);
  if (reviews <= 0 || data.rating == null || data.rating <= 0) {
    return STORE_SHARE_COPY.newSeller;
  }
  const rating = Number(data.rating.toFixed(1));
  return `⭐ ${rating} (${reviews} ${reviews === 1 ? "Review" : "Reviews"})`;
}

export function formatStoreShareFollowersLabel(count: number): string {
  return `${Math.max(0, count)} Followers`;
}

export function formatStoreShareListingsLabel(count: number): string {
  return `${Math.max(0, count)} Listings`;
}

export function buildStoreShareUtmUrl(
  storeUrl: string,
  source: StoreShareChannel,
): string {
  assertStoreShareProductionUrl(storeUrl);
  if (source === "copy_link" || source === "qr" || source === "native" || source === "more") {
    return storeUrl;
  }
  const url = new URL(storeUrl);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "store_share");
  return url.toString();
}

export function buildStoreWhatsAppShareUrl(storeUrl: string): string {
  assertStoreShareProductionUrl(storeUrl);
  const text = [
    STORE_SHARE_MESSAGE.line1,
    "Buy • Sell • Grow on ROVEXO 🚀",
    storeUrl,
  ].join("\n");
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildStoreFacebookShareUrl(storeUrl: string): string {
  assertStoreShareProductionUrl(storeUrl);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`;
}

export function buildStoreMessengerShareUrl(storeUrl: string): string {
  assertStoreShareProductionUrl(storeUrl);
  return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(storeUrl)}&redirect_uri=${encodeURIComponent(storeUrl)}`;
}

export function buildStoreTelegramShareUrl(storeUrl: string, text: string): string {
  assertStoreShareProductionUrl(storeUrl);
  return `https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(text)}`;
}

export function buildStoreQrTargetUrl(username: string): string {
  return buildStoreUrl(username);
}

export function buildStoreQrImageUrl(username: string, size = 256): string {
  const target = buildStoreQrTargetUrl(username);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(target)}`;
}

export function buildStoreOgTitle(username: string): string {
  return `${normalizeStoreUsername(username)}'s Store on ROVEXO`;
}

export function buildStoreOgDescription(
  username: string,
  listingCount?: number | null,
): string {
  const handle = normalizeStoreUsername(username);
  if (listingCount == null) {
    return `Discover unique items from ${handle} on ROVEXO.`;
  }
  return `Discover ${Math.max(0, listingCount)} items from ${handle} on ROVEXO.`;
}

function publicStoreAvatarParam(avatarUrl: string | null): string | null {
  if (!avatarUrl) return null;
  const trimmed = avatarUrl.trim();
  if (!trimmed.startsWith("https://")) return null;
  if (storeShareUrlContainsForbiddenHost(trimmed)) return null;
  return trimmed.slice(0, 500);
}

export function buildStoreOgImagePath(data: StoreShareData): string {
  const params = new URLSearchParams({
    kind: "store",
    name: data.displayName.slice(0, 80),
    username: data.username.slice(0, 64),
    verified: data.verified ? "1" : "0",
    reviews: String(Math.max(0, data.reviewCount)),
    followers: String(Math.max(0, data.followersCount)),
    listings: String(Math.max(0, data.activeListingsCount)),
  });
  if (data.rating != null && data.reviewCount > 0 && data.rating > 0) {
    params.set("rating", data.rating.toFixed(1));
  }
  const avatar = publicStoreAvatarParam(data.avatarUrl);
  if (avatar) {
    params.set("avatar", avatar);
  }
  return `/api/seo/og?${params.toString()}`;
}

/** Absolute production Store OG image. Never localhost or the current host. */
export function buildStoreOgImageUrl(data: StoreShareData): string {
  const url = `${PRODUCTION_ORIGIN}${buildStoreOgImagePath(data)}`;
  if (!url.startsWith(`${PRODUCTION_ORIGIN}/api/seo/og?`)) {
    throw new Error("STORE_SHARE_NON_PRODUCTION_URL");
  }
  if (storeShareUrlContainsForbiddenHost(url)) {
    throw new Error("STORE_SHARE_LOCALHOST_URL");
  }
  if (!url.includes("kind=store") || !url.includes(`username=${encodeURIComponent(data.username)}`)) {
    throw new Error("STORE_SHARE_OG_USERNAME_MISSING");
  }
  return url;
}

export function buildStoreShareMetadata(
  data: StoreShareData,
  options?: { listingsKnown?: boolean },
): {
  title: string;
  description: string;
  canonicalPath: string;
  canonicalUrl: string;
  ogImagePath: string;
  ogImageUrl: string;
  ogType: "website";
  twitterCard: "summary_large_image";
} {
  const listingsKnown = options?.listingsKnown ?? true;
  const canonicalPath = buildStorePath(data.username);
  return {
    title: buildStoreOgTitle(data.username),
    description: buildStoreOgDescription(
      data.username,
      listingsKnown ? data.activeListingsCount : null,
    ),
    canonicalPath,
    canonicalUrl: buildStoreUrl(data.username),
    ogImagePath: buildStoreOgImagePath(data),
    ogImageUrl: buildStoreOgImageUrl(data),
    ogType: "website",
    twitterCard: "summary_large_image",
  };
}

export function toStoreShareData(input: {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  verified?: boolean;
  rating?: number | null;
  reviewCount?: number;
  followersCount?: number;
  followingCount?: number;
  activeListingsCount?: number;
}): StoreShareData {
  const username = normalizeStoreUsername(input.username);
  const reviewCount = Math.max(0, input.reviewCount ?? 0);
  const rating =
    reviewCount > 0 && input.rating != null && input.rating > 0 ? input.rating : null;
  return {
    displayName: (input.displayName ?? username).trim() || username,
    username,
    avatarUrl: input.avatarUrl ?? null,
    verified: Boolean(input.verified),
    rating,
    reviewCount,
    followersCount: Math.max(0, input.followersCount ?? 0),
    followingCount: Math.max(0, input.followingCount ?? 0),
    activeListingsCount: Math.max(0, input.activeListingsCount ?? 0),
    storeUrl: buildStoreUrl(username),
  };
}
