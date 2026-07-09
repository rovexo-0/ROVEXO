import { BusinessDashboardPage } from "@/features/business/dashboard/components/BusinessDashboardPage";
import { fetchBusinessDashboard } from "@/lib/business/queries";
import { getBusinessProfile } from "@/lib/profile/data";
import { redirect } from "next/navigation";

export default async function BusinessDashboardRoute() {
  const profile = await getBusinessProfile();

  if (!profile.capabilities.hasBusinessVerification) {
    redirect("/account");
  }

  const data = await fetchBusinessDashboard(profile.id);

  return <BusinessDashboardPage data={data} />;
}
