import { Suspense } from "react";
import { OrdersV1 } from "@/features/account-module/components/OrdersV1";
import { fetchOrdersForUser } from "@/lib/orders/queries";
import { getProfile } from "@/lib/profile/data";

export default async function OrdersRoute() {
  const profile = await getProfile();
  const [boughtOrders, soldOrders] = await Promise.all([
    fetchOrdersForUser(profile.id, "buyer"),
    fetchOrdersForUser(profile.id, "seller"),
  ]);

  return (
    <Suspense>
      <OrdersV1
        boughtOrders={boughtOrders}
        soldOrders={soldOrders}
        unreadNotifications={profile.unreadNotifications}
      />
    </Suspense>
  );
}
