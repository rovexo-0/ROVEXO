import {
  getBusinessAnalyticsData,
  getSellerAnalyticsData,
} from "@/lib/analytics/store";
import type { AnalyticsDateRange } from "@/lib/analytics/types";
import { requireAuthContext } from "@/lib/auth/session";

export async function fetchSellerAnalytics(range: AnalyticsDateRange = "30d") {
  const { user } = await requireAuthContext();
  return getSellerAnalyticsData(user.id, range);
}

export async function fetchBusinessAnalytics(range: AnalyticsDateRange = "30d") {
  const { user } = await requireAuthContext();
  return getBusinessAnalyticsData(user.id, range);
}
