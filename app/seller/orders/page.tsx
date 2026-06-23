import { OrdersListPage } from "@/features/orders/components/OrdersListPage";
import { fetchOrdersForUser } from "@/lib/orders/queries";
import { getProfile } from "@/lib/profile/data";
import { redirect } from "next/navigation";

export default async function SellerOrdersRoute() {
  const profile = await getProfile();

  if (!profile.isSeller) {
    redirect("/account");
  }

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
