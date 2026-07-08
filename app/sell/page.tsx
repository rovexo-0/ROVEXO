import { SellScreen } from "@/features/sell/ui/SellScreen";
import { getProfile } from "@/lib/profile/data";

export default async function SellRoute() {
  await getProfile();
  return <SellScreen />;
}
