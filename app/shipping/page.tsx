import { Suspense } from "react";
import { ShippingEngineHub } from "@/features/shipping/ShippingEngineHub";
import { SHIPPING_ENGINE_MODULES } from "@/lib/shipping-engine/registry";
import { getPublicShippingEngineConfig, listUserShippingOrders } from "@/lib/shipping-engine/reader";
import { getProfile } from "@/lib/profile/data";

export default async function ShippingRoute() {
  const profile = await getProfile();
  const [config, orders] = await Promise.all([
    getPublicShippingEngineConfig(),
    listUserShippingOrders(profile.id),
  ]);

  return (
    <Suspense fallback={<div className="se-hub p-ds-5">Loading shipping…</div>}>
      <ShippingEngineHub config={config} modules={SHIPPING_ENGINE_MODULES} orders={orders} />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: "Shipping | ROVEXO",
    description: "ROVEXO Shipping Engine — track deliveries, manage profiles, labels, and returns.",
  };
}
