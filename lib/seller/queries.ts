import { fetchSellerDashboardRepository } from "@/lib/seller/repository";
import { getProfile } from "@/lib/profile/data";
import type { SellerDashboardData } from "@/types/seller";

export async function fetchSellerDashboardPage(): Promise<SellerDashboardData> {
  const profile = await getProfile();
  return fetchSellerDashboardRepository(profile);
}

/** @deprecated Use fetchSellerDashboardPage for the official /seller dashboard. */
export async function fetchSellerDashboard(userId?: string) {
  const { getSellerDashboardData } = await import("@/lib/seller/dashboard");
  return getSellerDashboardData(userId);
}
