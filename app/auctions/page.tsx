import type { Metadata } from "next";
import { AuctionsComingSoonPage } from "@/features/auctions/components/AuctionsComingSoonPage";
import { getAuthContext } from "@/lib/auth/session";
import { isSubscribedToAuctionLaunch } from "@/lib/auctions/notify-store";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Live Auctions",
  description:
    "Live Auctions are coming soon to ROVEXO. Get notified when real-time bidding, watchlists, and purchase protection launch.",
  path: "/auctions",
});

export default async function AuctionsRoutePage() {
  const auth = await getAuthContext();
  const initialSubscribed = auth ? await isSubscribedToAuctionLaunch(auth.user.id) : false;

  return (
    <AuctionsComingSoonPage isLoggedIn={Boolean(auth)} initialSubscribed={initialSubscribed} />
  );
}
