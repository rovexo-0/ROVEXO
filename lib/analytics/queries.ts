import {
  getBusinessAnalyticsData,
  getSellerAnalyticsData,
} from "@/lib/analytics/store";
import type { AnalyticsDateRange } from "@/lib/analytics/types";
import type { BusinessAnalyticsPeriodId } from "@/lib/analytics/business-analytics-v1";
import { requireAuthContext } from "@/lib/auth/session";

export async function fetchSellerAnalytics(range: AnalyticsDateRange = "30d") {
  const { user } = await requireAuthContext();
  return getSellerAnalyticsData(user.id, range);
}

export async function fetchBusinessAnalytics(
  period: BusinessAnalyticsPeriodId = "30d",
  custom?: { from?: string | null; to?: string | null },
) {
  const { user } = await requireAuthContext();
  return getBusinessAnalyticsData(user.id, period, custom);
}
