import type { AuctionFilter, AuctionListing } from "@/lib/auctions/types";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function isEndingWithin24Hours(endsAt: string | null | undefined): boolean {
  if (!endsAt) return false;
  const remaining = new Date(endsAt).getTime() - Date.now();
  return remaining > 0 && remaining <= DAY_MS;
}

export function formatAuctionCountdown(endsAt: string | null | undefined): string {
  if (!endsAt) return "—";
  const remaining = new Date(endsAt).getTime() - Date.now();
  if (remaining <= 0) return "Ended";

  const days = Math.floor(remaining / DAY_MS);
  const hours = Math.floor((remaining % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((remaining % HOUR_MS) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function computeMinNextBid(currentBid: number): number {
  if (currentBid < 10) return Math.round((currentBid + 0.5) * 100) / 100;
  if (currentBid < 100) return Math.round((currentBid + 1) * 100) / 100;
  return Math.round((currentBid + 5) * 100) / 100;
}

export function filterAuctions(
  auctions: AuctionListing[],
  filter: AuctionFilter,
  categorySlug?: string | null,
): AuctionListing[] {
  let items = [...auctions];

  if (categorySlug) {
    items = items.filter((item) => item.categorySlug?.startsWith(categorySlug));
  }

  switch (filter) {
    case "ending_soon":
      return items.filter((item) => item.isEndingSoon).sort(sortByEnding);
    case "new":
      return [...items].sort((a, b) => b.createdAtMs - a.createdAtMs);
    case "most_watched":
      return [...items].sort((a, b) => b.watchers - a.watchers);
    case "lowest_bid":
      return [...items].sort(
        (a, b) => (a.auctionCurrentBid ?? a.price) - (b.auctionCurrentBid ?? b.price),
      );
    case "highest_value":
      return [...items].sort(
        (a, b) => (b.auctionCurrentBid ?? b.price) - (a.auctionCurrentBid ?? a.price),
      );
    case "buy_it_now":
      return items.filter((item) => item.hasBuyNow);
    case "featured":
      return items.filter((item) => item.isFeatured);
    default:
      return items;
  }
}

function sortByEnding(a: AuctionListing, b: AuctionListing): number {
  const aEnd = a.auctionEndsAt ? new Date(a.auctionEndsAt).getTime() : Number.MAX_SAFE_INTEGER;
  const bEnd = b.auctionEndsAt ? new Date(b.auctionEndsAt).getTime() : Number.MAX_SAFE_INTEGER;
  return aEnd - bEnd;
}

export function auctionEndsAtFromDays(days: number): string {
  const ends = new Date();
  ends.setDate(ends.getDate() + days);
  return ends.toISOString();
}
