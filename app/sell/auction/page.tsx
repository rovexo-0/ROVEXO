import { redirect } from "next/navigation";

/** Auctions sell UI is out of Compact Premium one-page Sell SSOT — use canonical /sell. */
export default function SellAuctionRedirect() {
  redirect("/sell");
}
