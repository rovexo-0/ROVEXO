import { redirect } from "next/navigation";
import { BusinessAnalyticsPage } from "@/features/analytics/components/BusinessAnalyticsPage";
import { fetchBusinessAnalytics } from "@/lib/analytics/queries";
import { loadPwaBusinessSession } from "@/lib/business/pwa-business-session";

/** Business Analytics v1 — Stripe + Business context required. */
export default async function BusinessAnalyticsRoute() {
  const { status } = await loadPwaBusinessSession();
  if (!status.stripe.verified) {
    redirect(status.hasBusinessProfile ? "/business/connect" : "/business/information");
  }
  if (status.activeSellerContext !== "business") {
    redirect("/account");
  }
  const data = await fetchBusinessAnalytics("30d");
  return <BusinessAnalyticsPage initialData={data} backHref="/business/menu" />;
}
