import { OrdersEngineListShell } from "@/features/orders-engine/OrdersEngineListShell";
import { fetchOrdersForUser } from "@/lib/orders/queries";
import { ORDERS_ENGINE_MODULES } from "@/lib/orders-engine/registry";
import { getOrdersEngineAnalyticsForUser, getPublicOrdersEngineConfig } from "@/lib/orders-engine/reader";
import { getProfile } from "@/lib/profile/data";

export default async function BuyerOrdersRoute() {
  const profile = await getProfile();
  const [orders, config, analytics] = await Promise.all([
    fetchOrdersForUser(profile.id, "buyer"),
    getPublicOrdersEngineConfig(),
    getOrdersEngineAnalyticsForUser(profile.id),
  ]);

  return (
    <OrdersEngineListShell
      orders={orders}
      userId={profile.id}
      config={config}
      modules={ORDERS_ENGINE_MODULES}
      analytics={analytics}
    />
  );
}
