/**
 * ROVEXO Badge Visual System v2.0 — artwork mapping only.
 *
 * Does NOT assign badges, score sellers, or change thresholds.
 * Badge Engine + Seller Performance remain the source of truth for
 * earned / in_progress / locked / progress.
 */

export const BADGE_VISUAL_SYSTEM_V2 = {
  version: "2.0",
  kind: "VISUAL_ONLY",
  lock: "lib/badge/badge-visual-system-v2.ts",
  artwork: "components/badge/CanonicalBadgeArtwork.tsx",
  doesNotModify: [
    "Badge Engine",
    "Performance Engine",
    "Rating Engine",
    "Reviews Engine",
    "database schema",
  ],
} as const;

export const BADGE_VISUAL_KEYS = [
  "first_sale",
  "orders_10",
  "orders_50",
  "orders_100",
  "orders_500",
  "orders_1000",
  "fast_responder",
  "excellent_response_time",
  "fast_dispatch",
  "fast_shipper",
  "top_rated",
  "reviews_100_positive",
  "verified_seller",
  "verified_business",
  "trending_seller",
  "trusted_seller",
  "top_seller",
  "premium_seller",
  "elite_seller",
  "reliable_buyer",
  "trusted_buyer",
  "community_contributor",
] as const;

export type BadgeVisualKey = (typeof BADGE_VISUAL_KEYS)[number];

export type BadgeVisualState = "earned" | "in_progress" | "locked";

export type BadgeVisualDefinition = {
  key: BadgeVisualKey;
  glyph: BadgeVisualKey;
  accent: string;
  plate: string;
  plateHi: string;
};

export const BADGE_VISUAL_CATALOG: Record<BadgeVisualKey, BadgeVisualDefinition> = {
  first_sale: {
    key: "first_sale",
    glyph: "first_sale",
    accent: "#F5C542",
    plate: "#7C3AED",
    plateHi: "#A78BFA",
  },
  orders_10: {
    key: "orders_10",
    glyph: "orders_10",
    accent: "#FDE68A",
    plate: "#8B5CF6",
    plateHi: "#C4B5FD",
  },
  orders_50: {
    key: "orders_50",
    glyph: "orders_50",
    accent: "#FDE68A",
    plate: "#A855F7",
    plateHi: "#E9D5FF",
  },
  orders_100: {
    key: "orders_100",
    glyph: "orders_100",
    accent: "#FDBA74",
    plate: "#6D28D9",
    plateHi: "#A78BFA",
  },
  orders_500: {
    key: "orders_500",
    glyph: "orders_500",
    accent: "#FDE68A",
    plate: "#5B21B6",
    plateHi: "#8B5CF6",
  },
  orders_1000: {
    key: "orders_1000",
    glyph: "orders_1000",
    accent: "#FDE68A",
    plate: "#4C1D95",
    plateHi: "#7C3AED",
  },
  fast_responder: {
    key: "fast_responder",
    glyph: "fast_responder",
    accent: "#FEF3C7",
    plate: "#F59E0B",
    plateHi: "#FBBF24",
  },
  excellent_response_time: {
    key: "excellent_response_time",
    glyph: "excellent_response_time",
    accent: "#E0F2FE",
    plate: "#0EA5E9",
    plateHi: "#38BDF8",
  },
  fast_dispatch: {
    key: "fast_dispatch",
    glyph: "fast_dispatch",
    accent: "#D1FAE5",
    plate: "#10B981",
    plateHi: "#34D399",
  },
  fast_shipper: {
    key: "fast_shipper",
    glyph: "fast_shipper",
    accent: "#FFEDD5",
    plate: "#F97316",
    plateHi: "#FB923C",
  },
  top_rated: {
    key: "top_rated",
    glyph: "top_rated",
    accent: "#FFF7D6",
    plate: "#EAB308",
    plateHi: "#FACC15",
  },
  reviews_100_positive: {
    key: "reviews_100_positive",
    glyph: "reviews_100_positive",
    accent: "#FCE7F3",
    plate: "#EC4899",
    plateHi: "#F472B6",
  },
  verified_seller: {
    key: "verified_seller",
    glyph: "verified_seller",
    accent: "#DCFCE7",
    plate: "#16A34A",
    plateHi: "#4ADE80",
  },
  verified_business: {
    key: "verified_business",
    glyph: "verified_business",
    accent: "#DBEAFE",
    plate: "#2563EB",
    plateHi: "#60A5FA",
  },
  trending_seller: {
    key: "trending_seller",
    glyph: "trending_seller",
    accent: "#FEE2E2",
    plate: "#EF4444",
    plateHi: "#F97316",
  },
  trusted_seller: {
    key: "trusted_seller",
    glyph: "trusted_seller",
    accent: "#CCFBF1",
    plate: "#0D9488",
    plateHi: "#2DD4BF",
  },
  top_seller: {
    key: "top_seller",
    glyph: "top_seller",
    accent: "#FEF9C3",
    plate: "#CA8A04",
    plateHi: "#FACC15",
  },
  premium_seller: {
    key: "premium_seller",
    glyph: "premium_seller",
    accent: "#CFFAFE",
    plate: "#0891B2",
    plateHi: "#22D3EE",
  },
  elite_seller: {
    key: "elite_seller",
    glyph: "elite_seller",
    accent: "#FAE8FF",
    plate: "#C026D3",
    plateHi: "#E879F9",
  },
  reliable_buyer: {
    key: "reliable_buyer",
    glyph: "reliable_buyer",
    accent: "#ECFCCB",
    plate: "#65A30D",
    plateHi: "#A3E635",
  },
  trusted_buyer: {
    key: "trusted_buyer",
    glyph: "trusted_buyer",
    accent: "#E2E8F0",
    plate: "#475569",
    plateHi: "#94A3B8",
  },
  community_contributor: {
    key: "community_contributor",
    glyph: "community_contributor",
    accent: "#EDE9FE",
    plate: "#7C3AED",
    plateHi: "#C4B5FD",
  },
};

const LABEL_ALIASES: Record<string, BadgeVisualKey> = {
  first_sale: "first_sale",
  "first sale": "first_sale",
  orders_10: "orders_10",
  "10 sales": "orders_10",
  "10 orders": "orders_10",
  orders_50: "orders_50",
  "50 sales": "orders_50",
  "50 orders": "orders_50",
  orders_100: "orders_100",
  "100 sales": "orders_100",
  "100 orders": "orders_100",
  orders_500: "orders_500",
  "500 orders": "orders_500",
  "500 sales": "orders_500",
  orders_1000: "orders_1000",
  "1000 orders": "orders_1000",
  "1000 sales": "orders_1000",
  fast_responder: "fast_responder",
  "fast responder": "fast_responder",
  excellent_response_time: "excellent_response_time",
  "excellent response time": "excellent_response_time",
  fast_dispatch: "fast_dispatch",
  "fast dispatcher": "fast_dispatch",
  fast_shipper: "fast_shipper",
  "fast shipper": "fast_shipper",
  top_rated: "top_rated",
  "top rated": "top_rated",
  reviews_100_positive: "reviews_100_positive",
  "100 positive reviews": "reviews_100_positive",
  verified_seller: "verified_seller",
  "verified seller": "verified_seller",
  verified_business: "verified_business",
  "verified business": "verified_business",
  trending_seller: "trending_seller",
  "trending seller": "trending_seller",
  trusted_seller: "trusted_seller",
  "trusted seller": "trusted_seller",
  top_seller: "top_seller",
  "top seller": "top_seller",
  premium_seller: "premium_seller",
  "premium seller": "premium_seller",
  elite_seller: "elite_seller",
  "elite seller": "elite_seller",
  reliable_buyer: "reliable_buyer",
  "reliable buyer": "reliable_buyer",
  trusted_buyer: "trusted_buyer",
  "trusted buyer": "trusted_buyer",
  community_contributor: "community_contributor",
  "community contributor": "community_contributor",
};

export function normalizeBadgeVisualLookup(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function resolveBadgeVisualKey(idOrLabel: string | null | undefined): BadgeVisualKey | null {
  if (!idOrLabel?.trim()) return null;
  const raw = idOrLabel.trim();
  if ((BADGE_VISUAL_KEYS as readonly string[]).includes(raw)) {
    return raw as BadgeVisualKey;
  }
  const spaced = normalizeBadgeVisualLookup(raw);
  const underscored = spaced.replace(/ /g, "_");
  if ((BADGE_VISUAL_KEYS as readonly string[]).includes(underscored)) {
    return underscored as BadgeVisualKey;
  }
  return LABEL_ALIASES[spaced] ?? LABEL_ALIASES[underscored] ?? null;
}

export function resolveBadgeVisual(
  idOrLabel: string | null | undefined,
): BadgeVisualDefinition | null {
  const key = resolveBadgeVisualKey(idOrLabel);
  return key ? BADGE_VISUAL_CATALOG[key] : null;
}

export function listBadgeVisualGlyphs(): BadgeVisualKey[] {
  return BADGE_VISUAL_KEYS.map((key) => BADGE_VISUAL_CATALOG[key].glyph);
}
