import { notFound } from "next/navigation";
import { OrderDetailPageShell } from "@/features/orders/components/OrderDetailPageShell";
import { fetchOrderForUser, getOrderViewRole } from "@/lib/orders/queries";
import { getProfile } from "@/lib/profile/data";

type BuyerOrderDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function BuyerOrderDetailRoute({ params }: BuyerOrderDetailRouteProps) {
  const { id } = await params;
  const profile = await getProfile();
  const order = await fetchOrderForUser(id, profile.id);

  if (!order || getOrderViewRole(order, profile.id) !== "buyer") {
    notFound();
  }

  return (
    <OrderDetailPageShell order={order} userId={profile.id} backHref="/orders" bottomNavTab="account" />
  );
}
