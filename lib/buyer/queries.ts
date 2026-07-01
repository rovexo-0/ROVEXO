import { fetchBuyerDashboardRepository } from "@/lib/buyer/repository";
import { getProfile } from "@/lib/profile/data";
import type { BuyerDashboardData } from "@/types/buyer";

export async function fetchBuyerDashboard(): Promise<BuyerDashboardData> {
  const profile = await getProfile();
  return fetchBuyerDashboardRepository(profile);
}
