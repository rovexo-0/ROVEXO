import type { Metadata } from "next";
import { AuctionsComingSoonPage } from "@/features/auctions/components/AuctionsComingSoonPage";
import { isSubscribedToAuctionLaunch } from "@/lib/auctions/notify-store";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Auctions · Coming Soon · ROVEXO",
  description:
    "A brand-new Auctions experience is on the way. Get notified when live bidding launches on ROVEXO.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AuctionsRoutePage() {
  const auth = await getAuthContext();
  const initialSubscribed = auth
    ? await isSubscribedToAuctionLaunch(auth.user.id)
    : false;

  return (
    <AuctionsComingSoonPage
      isAuthenticated={Boolean(auth)}
      initialSubscribed={initialSubscribed}
    />
  );
}
