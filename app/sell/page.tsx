import { SellPage } from "@/features/sell/components/SellPage";
import { getProfile } from "@/lib/profile/data";

export default async function SellRoute() {
  await getProfile();
  return <SellPage />;
}
