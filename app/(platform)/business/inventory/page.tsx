import { Suspense } from "react";
import { BusinessInventoryPage } from "@/features/business/inventory/components/BusinessInventoryPage";
import { fetchBusinessInventory } from "@/lib/business/queries";
import { getBusinessProfile } from "@/lib/profile/data";

/** Business Inventory — unverified users stay in Business Verification (never My Account). */
export default async function BusinessInventoryRoute() {
  await getBusinessProfile();
  const data = await fetchBusinessInventory();

  return (
    <Suspense>
      <BusinessInventoryPage data={data} />
    </Suspense>
  );
}
