import { SellerAnalyticsPage } from "@/features/analytics/components/SellerAnalyticsPage";
import { fetchSellerAnalytics } from "@/lib/analytics/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";

export default async function SellerAnalyticsRoute() {
  const profile = await fetchProfile();

  if (!profile.isSeller) {
    redirect("/account");
  }

  const data = await fetchSellerAnalytics("30d");

  return <SellerAnalyticsPage initialData={data} />;
}
