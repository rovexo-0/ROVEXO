import { SellPage } from "@/features/sell/components/SellPage";
import { getSellListingMode } from "@/lib/profile/account";
import { getProfile } from "@/lib/profile/data";

export default async function SellRoute() {
  const profile = await getProfile();
  const listingMode = getSellListingMode(profile.accountType);

  return <SellPage listingMode={listingMode} />;
}
