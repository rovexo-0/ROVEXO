import { SellerDashboardPage } from "@/features/seller/dashboard/components/SellerDashboardPage";
import { fetchSellerDashboard } from "@/lib/seller/queries";
import { getProfile } from "@/lib/profile/data";
import { redirect } from "next/navigation";

export default async function SellerDashboardRoute() {
  const profile = await getProfile();

  if (!profile.isSeller) {
    redirect("/account");
  }

  const data = await fetchSellerDashboard(profile.id);

  return <SellerDashboardPage data={data} />;
}
