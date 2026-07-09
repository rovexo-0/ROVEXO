import { BusinessAnalyticsPage } from "@/features/analytics/components/BusinessAnalyticsPage";
import { fetchBusinessAnalytics } from "@/lib/analytics/queries";
import { getBusinessProfile } from "@/lib/profile/data";
import { redirect } from "next/navigation";

export default async function BusinessAnalyticsRoute() {
  const profile = await getBusinessProfile();

  if (!profile.capabilities.hasBusinessVerification) {
    redirect("/account");
  }

  const data = await fetchBusinessAnalytics("30d");

  return <BusinessAnalyticsPage initialData={data} />;
}
