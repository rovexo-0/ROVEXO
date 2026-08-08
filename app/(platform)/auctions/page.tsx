import "@/styles/rovexo/auctions.css";
import { redirect } from "next/navigation";

/**
 * Live Auctions are not Launch Ready for consumer traffic.
 * Keep the route for bookmarks/SEO; send users to Search (no Coming Soon).
 * OPT-P0-CSS-01: auctions.css is owned by this canonical auctions entry (not global index).
 */
export default function AuctionsRoutePage() {
  redirect("/search");
}
