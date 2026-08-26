/**
 * ROVEXO Store Hero Share Card v1.0 — OG / social preview renderer only.
 *
 * STATUS: FROZEN · HARD FREEZE · SHARE / OG ONLY
 * Unlock: END STORE HERO FREEZE
 *
 * Not a native Shop component. Not a Visit Store replacement.
 * One structure for every seller. Only public data may change.
 */

import {
  STORE_SHARE_COPY,
  formatStoreSharePublicHost,
  formatStoreShareStatusLabel,
  isValidStoreUsername,
  normalizeStoreUsername,
  resolveStoreShareCardDescription,
  storeShareUrlContainsForbiddenHost,
  truncateStoreShareCardText,
  type StoreShareData,
} from "@/lib/store-sharing/store-share-v1";

export const STORE_HERO_SHARE_CARD = "store-hero-share-card-v1" as const;

export const STORE_HERO_SHARE_CARD_SIZE = {
  width: 1200,
  height: 630,
} as const;

export const STORE_HERO_FEATURED_SLOT_COUNT = 5 as const;
export const STORE_HERO_TRUST_SLOT_COUNT = 5 as const;
export const STORE_HERO_STAT_SLOT_COUNT = 3 as const;

export const STORE_HERO_SHARE_CARD_STRUCTURE_IDS = [
  "store-hero-brand",
  "store-hero-cover",
  "store-hero-avatar",
  "store-hero-name",
  "store-hero-username",
  "store-hero-rating",
  "store-hero-chips",
  "store-hero-stats",
  "store-hero-trust",
  "store-hero-featured",
  "store-hero-footer",
] as const;

/** Platform trust strip — identical slots for every seller. Copy is ROVEXO, not a ranking. */
export const STORE_HERO_TRUST_SIGNALS = [
  { id: "trusted", title: "Trusted Seller", subtitle: "Shop with confidence" },
  { id: "fast", title: "Fast & Reliable", subtitle: "Quick dispatch" },
  { id: "reviews", title: "Great Reviews", subtitle: "Positive feedback" },
  { id: "returns", title: "Easy Returns", subtitle: "Hassle free" },
  { id: "secure", title: "Secure Payments", subtitle: "Protected by ROVEXO" },
] as const;

export type StoreHeroFeaturedListing = {
  title: string;
  price: number | null;
  imageUrl: string | null;
};

export type StoreHeroShareCardModel = {
  displayName: string;
  username: string;
  verified: boolean;
  rating: number | null;
  reviewCount: number;
  listingsCount: number;
  soldCount: number;
  followersCount: number;
  category: string | null;
  location: string | null;
  coverImageUrl: string | null;
  avatarUrl: string | null;
  storeDescription: string | null;
  featuredListings: StoreHeroFeaturedListing[];
};

export type StoreHeroShareCardAssets = {
  brandMarkDataUri: string | null;
  avatarDataUri: string | null;
  coverDataUri: string | null;
  listingImageDataUris: Array<string | null>;
};

const PRIVATE_FIELD_PATTERN = /email|phone|address|inbox|wallet|stripe|password|balance/i;

export function formatStoreHeroCompactCount(count: number): string {
  const value = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  if (value < 1000) return String(value);
  if (value < 10_000) {
    const tenths = Math.round(value / 100) / 10;
    return tenths % 1 === 0 ? `${tenths.toFixed(0)}K` : `${tenths.toFixed(1)}K`;
  }
  if (value < 1_000_000) return `${Math.round(value / 1000)}K`;
  return `${Math.round(value / 100_000) / 10}M`;
}

export function formatStoreHeroPrice(amount: number | null): string {
  if (amount == null || !Number.isFinite(amount) || amount < 0) return "";
  return `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function publicStoreHeroImageParam(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) return null;
  if (storeShareUrlContainsForbiddenHost(trimmed)) return null;
  if (trimmed.toLowerCase().includes("placeholder-product")) return null;
  return trimmed.slice(0, 500);
}

export function sanitizeStoreHeroPublicText(value: string, maxChars: number): string {
  const cleaned = value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  return truncateStoreShareCardText(cleaned || "ROVEXO Store", maxChars);
}

export function padStoreHeroFeaturedListings(
  listings: StoreHeroFeaturedListing[] | null | undefined,
): Array<StoreHeroFeaturedListing | null> {
  const slots: Array<StoreHeroFeaturedListing | null> = Array.from(
    { length: STORE_HERO_FEATURED_SLOT_COUNT },
    () => null,
  );
  const source = Array.isArray(listings) ? listings : [];
  for (let i = 0; i < STORE_HERO_FEATURED_SLOT_COUNT; i += 1) {
    const item = source[i];
    if (!item) continue;
    const title = typeof item.title === "string" ? item.title.replace(/\s+/g, " ").trim() : "";
    const price = item.price != null && Number.isFinite(item.price) && item.price >= 0 ? item.price : null;
    slots[i] = {
      title: title.slice(0, 42),
      price,
      imageUrl: publicStoreHeroImageParam(item.imageUrl),
    };
  }
  return slots;
}

export function toStoreHeroShareCardModel(data: StoreShareData): StoreHeroShareCardModel {
  const username = isValidStoreUsername(data.username)
    ? normalizeStoreUsername(data.username)
    : "";
  return {
    displayName: (data.displayName || username || "ROVEXO Store").trim() || "ROVEXO Store",
    username,
    verified: Boolean(data.verified),
    rating: data.rating,
    reviewCount: Math.max(0, data.reviewCount),
    listingsCount: Math.max(0, data.activeListingsCount),
    soldCount: Math.max(0, data.soldCount ?? 0),
    followersCount: Math.max(0, data.followersCount),
    category: data.category?.trim() || null,
    location: data.location?.trim() || null,
    coverImageUrl: publicStoreHeroImageParam(data.coverImageUrl),
    avatarUrl: publicStoreHeroImageParam(data.avatarUrl),
    storeDescription: data.storeDescription,
    featuredListings: (data.featuredListings ?? []).slice(0, STORE_HERO_FEATURED_SLOT_COUNT),
  };
}

export function parseStoreHeroShareCardFromSearchParams(
  searchParams: URLSearchParams,
): StoreHeroShareCardModel {
  const rawUsername = (searchParams.get("username") ?? "").trim();
  const username = isValidStoreUsername(rawUsername) ? normalizeStoreUsername(rawUsername) : "";
  const reviews = Math.max(0, Number(searchParams.get("reviews") ?? 0) || 0);
  const ratingRaw = searchParams.get("rating");
  const rating =
    ratingRaw && reviews > 0 && Number(ratingRaw) > 0 ? Number(ratingRaw) : null;
  const featuredListings: StoreHeroFeaturedListing[] = [];
  for (let i = 0; i < STORE_HERO_FEATURED_SLOT_COUNT; i += 1) {
    const title = (searchParams.get(`n${i}`) ?? "").trim();
    const priceRaw = searchParams.get(`p${i}`);
    const imageUrl = searchParams.get(`i${i}`);
    if (!title && !priceRaw && !imageUrl) continue;
    const price = priceRaw != null && priceRaw !== "" ? Number(priceRaw) : null;
    featuredListings.push({
      title,
      price: price != null && Number.isFinite(price) && price >= 0 ? price : null,
      imageUrl,
    });
  }
  return {
    displayName: (searchParams.get("name") ?? "").trim() || username || "ROVEXO Store",
    username,
    verified: searchParams.get("verified") === "1",
    rating,
    reviewCount: reviews,
    listingsCount: Math.max(0, Number(searchParams.get("listings") ?? 0) || 0),
    soldCount: Math.max(0, Number(searchParams.get("sold") ?? 0) || 0),
    followersCount: Math.max(0, Number(searchParams.get("followers") ?? 0) || 0),
    category: (searchParams.get("cat") ?? "").trim() || null,
    location: (searchParams.get("loc") ?? "").trim() || null,
    coverImageUrl: publicStoreHeroImageParam(searchParams.get("cover")),
    avatarUrl: publicStoreHeroImageParam(searchParams.get("avatar")),
    storeDescription: searchParams.get("description"),
    featuredListings,
  };
}

export function storeHeroShareCardContainsPrivateData(value: string): boolean {
  return PRIVATE_FIELD_PATTERN.test(value);
}

export function extractStoreHeroShareCardStructure(svg: string): string[] {
  return STORE_HERO_SHARE_CARD_STRUCTURE_IDS.filter((id) => svg.includes(`id="${id}"`));
}

export function normalizeStoreHeroShareCardStructure(svg: string): string {
  return svg
    .replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, "<text/>")
    .replace(/\shref="[^"]*"/g, ' href="asset"')
    .replace(/store-hero-verified/g, "store-hero-verified");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function chipLabel(primary: string | null, fallback: string): string {
  const value = primary?.replace(/\s+/g, " ").trim();
  return truncateStoreShareCardText(value || fallback, 18);
}

export function renderStoreHeroShareCardSvg(
  model: StoreHeroShareCardModel,
  assets: StoreHeroShareCardAssets,
): string {
  const { width, height } = STORE_HERO_SHARE_CARD_SIZE;
  const username = model.username;
  const name = sanitizeStoreHeroPublicText(model.displayName, 22);
  const handle = username ? `@${truncateStoreShareCardText(username, 24)}` : "@store";
  const status = formatStoreShareStatusLabel({
    rating: model.rating,
    reviewCount: model.reviewCount,
  });
  const description = resolveStoreShareCardDescription(model.storeDescription);
  const hostUrl = username
    ? truncateStoreShareCardText(formatStoreSharePublicHost(username), 36)
    : "rovexo.co.uk";
  const initial = escapeXml((name.trim()[0] || "R").toUpperCase());
  const featured = padStoreHeroFeaturedListings(model.featuredListings);
  const listingImages = Array.from({ length: STORE_HERO_FEATURED_SLOT_COUNT }, (_, i) => {
    return assets.listingImageDataUris[i] ?? null;
  });

  const avatarMarkup = assets.avatarDataUri
    ? `<defs><clipPath id="store-hero-avatar-clip"><circle cx="96" cy="248" r="52"/></clipPath></defs>
  <circle cx="96" cy="248" r="56" fill="#f3e8ff"/>
  <circle cx="96" cy="248" r="54" fill="#ffffff"/>
  <image href="${escapeXml(assets.avatarDataUri)}" x="44" y="196" width="104" height="104" preserveAspectRatio="xMidYMid slice" clip-path="url(#store-hero-avatar-clip)"/>`
    : `<circle cx="96" cy="248" r="56" fill="#f3e8ff"/>
  <text x="96" y="262" text-anchor="middle" fill="#7c3aed" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700">${initial}</text>`;

  const verifiedBadge = model.verified
    ? `<g id="store-hero-verified">
  <circle cx="136" cy="288" r="14" fill="#9333ea"/>
  <path d="M130 288 l4 4 9-10" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>`
    : `<g id="store-hero-verified"></g>`;

  const coverMarkup = assets.coverDataUri
    ? `<image href="${escapeXml(assets.coverDataUri)}" x="0" y="46" width="${width}" height="168" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="0" y="46" width="${width}" height="168" fill="#3b0764"/>
  <rect x="0" y="46" width="${width}" height="168" fill="url(#store-hero-cover-fallback)"/>`;

  const brandVisual = assets.brandMarkDataUri
    ? `<image href="${escapeXml(assets.brandMarkDataUri)}" x="1128" y="6" width="36" height="36" preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="1146" y="32" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700">RX</text>`;

  const chips = [
    chipLabel(model.category, "Marketplace"),
    "Store",
    chipLabel(model.location, "UK"),
  ];

  const stats = [
    { label: "Listings", value: formatStoreHeroCompactCount(model.listingsCount) },
    { label: "Sold", value: formatStoreHeroCompactCount(model.soldCount) },
    { label: "Followers", value: formatStoreHeroCompactCount(model.followersCount) },
  ];

  const featuredMarkup = featured
    .map((item, index) => {
      const x = 36 + index * 229;
      const image = listingImages[index];
      const photo = image
        ? `<image href="${escapeXml(image)}" x="${x}" y="448" width="213" height="92" preserveAspectRatio="xMidYMid slice"/>`
        : `<rect x="${x}" y="448" width="213" height="92" fill="#ede9fe"/>`;
      const price = formatStoreHeroPrice(item?.price ?? null);
      const title = truncateStoreShareCardText(item?.title || "", 16);
      return `<g id="store-hero-listing-${index}">
  <rect x="${x}" y="448" width="213" height="148" rx="12" fill="#f8f5ff"/>
  ${photo}
  <text x="${x + 10}" y="564" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeXml(price || "—")}</text>
  <text x="${x + 10}" y="584" fill="#4b5563" font-family="Arial, Helvetica, sans-serif" font-size="13">${escapeXml(title)}</text>
</g>`;
    })
    .join("\n");

  const trustMarkup = STORE_HERO_TRUST_SIGNALS.map((signal, index) => {
    const x = 36 + index * 229;
    return `<g id="store-hero-trust-${signal.id}">
  <text x="${x}" y="392" fill="#f5d0fe" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700">${escapeXml(signal.title)}</text>
  <text x="${x}" y="412" fill="#e9d5ff" font-family="Arial, Helvetica, sans-serif" font-size="12">${escapeXml(signal.subtitle)}</text>
</g>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-store-hero-share-card="${STORE_HERO_SHARE_CARD}">
  <defs>
    <linearGradient id="store-hero-cover-fallback" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6d28d9"/>
      <stop offset="100%" stop-color="#9333ea"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <g id="store-hero-brand">
    <rect x="0" y="0" width="${width}" height="46" fill="#1a1028"/>
    <text x="36" y="30" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">ROVEXO</text>
    <text x="140" y="30" fill="#d8b4fe" font-family="Arial, Helvetica, sans-serif" font-size="14">${escapeXml(STORE_SHARE_COPY.promoLine)}</text>
    ${brandVisual}
  </g>
  <g id="store-hero-cover">
    ${coverMarkup}
    <rect x="0" y="46" width="${width}" height="168" fill="#1a1028" opacity="0.18"/>
  </g>
  <rect x="0" y="214" width="${width}" height="148" fill="#1a1028"/>
  <g id="store-hero-avatar">
    ${avatarMarkup}
    ${verifiedBadge}
  </g>
  <g id="store-hero-name">
    <text x="172" y="250" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">${escapeXml(name)}</text>
  </g>
  <g id="store-hero-username">
    <text x="172" y="280" fill="#c4b5fd" font-family="Arial, Helvetica, sans-serif" font-size="18">${escapeXml(handle)}</text>
  </g>
  <g id="store-hero-rating">
    <text x="172" y="308" fill="#fde68a" font-family="Arial, Helvetica, sans-serif" font-size="16">${escapeXml(status)}</text>
  </g>
  <g id="store-hero-chips">
    <rect x="172" y="320" width="150" height="26" rx="8" fill="#2e1064"/>
    <text x="247" y="338" text-anchor="middle" fill="#e9d5ff" font-family="Arial, Helvetica, sans-serif" font-size="12">${escapeXml(chips[0])}</text>
    <rect x="330" y="320" width="110" height="26" rx="8" fill="#2e1064"/>
    <text x="385" y="338" text-anchor="middle" fill="#e9d5ff" font-family="Arial, Helvetica, sans-serif" font-size="12">${escapeXml(chips[1])}</text>
    <rect x="448" y="320" width="90" height="26" rx="8" fill="#2e1064"/>
    <text x="493" y="338" text-anchor="middle" fill="#e9d5ff" font-family="Arial, Helvetica, sans-serif" font-size="12">${escapeXml(chips[2])}</text>
  </g>
  <g id="store-hero-stats">
    <text x="760" y="258" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${escapeXml(stats[0].value)}</text>
    <text x="760" y="280" fill="#c4b5fd" font-family="Arial, Helvetica, sans-serif" font-size="13">${escapeXml(stats[0].label)}</text>
    <text x="920" y="258" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${escapeXml(stats[1].value)}</text>
    <text x="920" y="280" fill="#c4b5fd" font-family="Arial, Helvetica, sans-serif" font-size="13">${escapeXml(stats[1].label)}</text>
    <text x="1070" y="258" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${escapeXml(stats[2].value)}</text>
    <text x="1070" y="280" fill="#c4b5fd" font-family="Arial, Helvetica, sans-serif" font-size="13">${escapeXml(stats[2].label)}</text>
  </g>
  <g id="store-hero-trust">
    <rect x="0" y="362" width="${width}" height="66" fill="#6d28d9"/>
    ${trustMarkup}
  </g>
  <g id="store-hero-featured">
    <text x="36" y="438" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700">Featured Listings</text>
    ${featuredMarkup}
  </g>
  <g id="store-hero-footer">
    <rect x="0" y="602" width="${width}" height="28" fill="#1a1028"/>
    <text x="36" y="621" fill="#e9d5ff" font-family="Arial, Helvetica, sans-serif" font-size="13">${escapeXml(hostUrl)}</text>
    <text x="1164" y="621" text-anchor="end" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="13">${escapeXml(truncateStoreShareCardText(description, 48))}</text>
  </g>
</svg>`;
}
