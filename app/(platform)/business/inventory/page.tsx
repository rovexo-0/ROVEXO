import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BusinessInventoryPage } from "@/features/business/inventory/components/BusinessInventoryPage";
import { fetchBusinessInventory } from "@/lib/business/queries";
import { loadPwaBusinessSession } from "@/lib/business/pwa-business-session";

/** Business Inventory — canonical products/stock. Stripe + Business context required. */
export default async function BusinessInventoryRoute() {
  const { status } = await loadPwaBusinessSession();
  if (!status.stripe.verified) {
    redirect(status.hasBusinessProfile ? "/business/connect" : "/business/information");
  }
  if (status.activeSellerContext !== "business") {
    redirect("/account");
  }
  const data = await fetchBusinessInventory();

  return (
    <Suspense>
      <BusinessInventoryPage data={data} />
    </Suspense>
  );
}
