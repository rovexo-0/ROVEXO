import { SellPage } from "@/features/sell/components/SellPage";
import { canManageInventory } from "@/lib/profile/account";
import { getProfile } from "@/lib/profile/data";

export default async function SellRoute() {
  const profile = await getProfile();

  return <SellPage manageInventory={canManageInventory(profile.accountType)} />;

}
