import { redirect } from "next/navigation";

/**
 * Live Auctions are not Launch Ready for consumer traffic.
 * Keep the route for bookmarks/SEO; send users to Search (no Coming Soon).
 */
export default function AuctionsRoutePage() {
  redirect("/search");
}
