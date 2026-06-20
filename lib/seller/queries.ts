import { getSellerDashboardData } from "@/lib/seller/dashboard";

export async function fetchSellerDashboard(userId?: string) {
  return getSellerDashboardData(userId);
}
