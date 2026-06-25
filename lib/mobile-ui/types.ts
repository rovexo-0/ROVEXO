export type MobileBadgeKey =
  | "messages"
  | "notifications"
  | "orders"
  | "saved"
  | "cart"
  | "wallet-payout";

export type MobileBadgeTone = "danger" | "success" | "muted";

export type MobilePrimaryHubId = "buy" | "sell" | "business" | "support";

export type MobileTile = {
  href: string;
  label: string;
  subtitle: string;
  badge?: MobileBadgeKey;
  badgeTone?: MobileBadgeTone;
  badgeCount?: number;
  pinned?: boolean;
};

export type MobileHubSection = {
  id: string;
  title: string;
  tiles: MobileTile[];
};

export type MobilePrimaryHub = {
  id: MobilePrimaryHubId;
  label: string;
  subtitle: string;
  tiles: MobileTile[];
};

export type MobileBadges = Record<MobileBadgeKey, number>;

export type MobileHubContext = {
  storeSlug?: string;
};
