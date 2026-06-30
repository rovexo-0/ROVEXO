import { NextResponse } from "next/server";
import { getAuctionsPageData } from "@/lib/auctions/queries";
import { filterAuctions } from "@/lib/auctions/utils";
import type { AuctionFilter } from "@/lib/auctions/types";

const FILTERS = new Set<AuctionFilter>([
  "all",
  "ending_soon",
  "new",
  "most_watched",
  "lowest_bid",
  "highest_value",
  "buy_it_now",
  "featured",
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterParam = searchParams.get("filter") ?? "all";
    const category = searchParams.get("category");
    const filter = FILTERS.has(filterParam as AuctionFilter)
      ? (filterParam as AuctionFilter)
      : "all";

    const data = await getAuctionsPageData();
    const items = filterAuctions(data.all, filter, category);

    return NextResponse.json({
      stats: data.stats,
      categories: data.categories,
      featured: data.featured,
      endingSoon: data.endingSoon,
      newest: data.newest,
      mostWatched: data.mostWatched,
      items,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load auctions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
