import { Suspense } from "react";
import { OrdersV1 } from "@/features/account-module/components/OrdersV1";
import { fetchOrdersForUser } from "@/lib/orders/queries";
import { getProfile } from "@/lib/profile/data";

export default async function BuyerOrdersRoute() {
  const profile = await getProfile();
  const orders = await fetchOrdersForUser(profile.id, "buyer");

  return (
    <Suspense>
      <OrdersV1 orders={orders} />
    </Suspense>
  );
}
