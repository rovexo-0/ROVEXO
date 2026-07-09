import { Suspense } from "react";
import { BusinessInventoryPage } from "@/features/business/inventory/components/BusinessInventoryPage";
import { fetchBusinessInventory } from "@/lib/business/queries";
import { getBusinessProfile } from "@/lib/profile/data";
import { redirect } from "next/navigation";

export default async function BusinessInventoryRoute() {
  const profile = await getBusinessProfile();

  if (!profile.capabilities.hasBusinessVerification) {
    redirect("/account");
  }

  const data = await fetchBusinessInventory();

  return (
    <Suspense>
      <BusinessInventoryPage data={data} />
    </Suspense>
  );
}
