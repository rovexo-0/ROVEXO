import type { MobileBadges, MobilePrimaryHubId, MobileTile } from "@/lib/mobile-ui/types";

export function sumTileBadges(tiles: MobileTile[], badges: MobileBadges): number {
  return tiles.reduce((total, tile) => {
    if (!tile.badge) return total;
    return total + (badges[tile.badge] ?? 0);
  }, 0);
}

export function getHubBadgeCount(
  hubId: MobilePrimaryHubId,
  tiles: MobileTile[],
  badges: MobileBadges,
): number {
  if (hubId === "buy") {
    return (
      badges.cart +
      badges.orders +
      badges.saved +
      badges.messages +
      badges.notifications
    );
  }
  if (hubId === "sell") {
    return badges.orders + badges["wallet-payout"] + badges.messages;
  }
  return sumTileBadges(tiles, badges);
}
