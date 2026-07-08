import { RovexoIcons } from "@/lib/icons/icons";
import type { RovexoIconRef } from "@/lib/icons/types";

const AUCTION_FEATURE_ICONS: Record<string, RovexoIconRef> = {
  "Real-Time Bidding": RovexoIcons.dashboard.auctions,
  "Instant Bid Updates": RovexoIcons.notifications.bell,
  "Watch Auctions": RovexoIcons.actions.heart,
  "Live Notifications": RovexoIcons.notifications.bell,
  "Purchase Protection": RovexoIcons.security.shield,
  "Verified Sellers": RovexoIcons.badges.verified,
  "Win Unique Items": RovexoIcons.actions.star,
  "Premium Marketplace Experience": RovexoIcons.dashboard.plans,
};

export function resolveAuctionFeatureIcon(label: string): RovexoIconRef {
  return AUCTION_FEATURE_ICONS[label] ?? RovexoIcons.dashboard.auctions;
}
