import { BusinessAnalyticsPage } from "@/features/analytics/components/BusinessAnalyticsPage";
import { fetchBusinessAnalytics } from "@/lib/analytics/queries";
import { getBusinessProfile } from "@/lib/profile/data";

/** Business Analytics — unverified users stay in Business Verification (never My Account). */
export default async function BusinessAnalyticsRoute() {
  await getBusinessProfile();
  const data = await fetchBusinessAnalytics("30d");
  return <BusinessAnalyticsPage initialData={data} />;
}
