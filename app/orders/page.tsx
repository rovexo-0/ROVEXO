import { Suspense } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { OrdersPage, OrdersPageSkeleton } from "@/features/orders/components/OrdersPage";
import { fetchOrdersForUser } from "@/lib/orders/queries";
import { getProfile } from "@/lib/profile/data";

function OrdersFallback() {
  return (
    <AccountCanonicalShell title="Orders" showHeaderTitle backHref="/account">
      <OrdersPageSkeleton />
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
    <Suspense fallback={<OrdersFallback />}>
      <OrdersPage
        boughtOrders={boughtOrders}
        soldOrders={soldOrders}
        unreadNotifications={profile.unreadNotifications}
      />
    </Suspense>
  );
}
