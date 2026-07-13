import { Suspense } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { OrdersHubSkeleton, OrdersHubV1 } from "@/features/orders/components/OrdersHubV1";
import { fetchOrdersForUser } from "@/lib/orders/queries";
import { getProfile } from "@/lib/profile/data";
import "@/styles/rovexo/orders-hub-v1.css";

function OrdersLoadingFallback() {
  return (
    <AccountCanonicalShell title="Orders" showHeaderTitle backHref="/account">
      <OrdersHubSkeleton />
    </AccountCanonicalShell>
  );
}

export default async function OrdersRoute() {
  const profile = await getProfile();
  const [boughtOrders, soldOrders] = await Promise.all([
    fetchOrdersForUser(profile.id, "buyer"),
    fetchOrdersForUser(profile.id, "seller"),
  ]);

  return (
    <Suspense fallback={<OrdersLoadingFallback />}>
      <OrdersHubV1
        boughtOrders={boughtOrders}
        soldOrders={soldOrders}
        unreadNotifications={profile.unreadNotifications}
      />
    </Suspense>
  );
}
