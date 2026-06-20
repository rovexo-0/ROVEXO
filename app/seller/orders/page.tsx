import { OrdersListPage } from "@/features/orders/components/OrdersListPage";
import { fetchOrdersForUser } from "@/lib/orders/queries";
import { getProfile } from "@/lib/profile/data";

export default async function SellerOrdersRoute() {
  const profile = await getProfile();
  const orders = await fetchOrdersForUser(profile.id, "seller");

  return (
    <OrdersListPage
      orders={orders}
      userId={profile.id}
      listRole="seller"
      backHref="/seller/dashboard"
      showBottomNav={false}
    />
  );
}
