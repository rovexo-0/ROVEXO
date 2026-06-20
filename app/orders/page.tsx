import { OrdersListPage } from "@/features/orders/components/OrdersListPage";
import { fetchOrdersForUser } from "@/lib/orders/queries";
import { getProfile } from "@/lib/profile/data";

export default async function BuyerOrdersRoute() {
  const profile = await getProfile();
  const orders = await fetchOrdersForUser(profile.id, "buyer");

  return (
    <OrdersListPage
      orders={orders}
      userId={profile.id}
      listRole="buyer"
      backHref="/account"
      bottomNavTab="account"
    />
  );
}
