export type MobileBadgeKey =
  | "messages"
  | "notifications"
  | "orders"
  | "saved"
  | "cart"
  | "wallet-payout";

export type MobileBadgeTone = "danger" | "success" | "muted";

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

export type MobileBadges = Record<MobileBadgeKey, number>;
