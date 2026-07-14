import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ order_id?: string; session_id?: string }>;
};

/** Post-payment helper — Sprint 1 sends buyers to Orders. */
export default async function CheckoutGlobalSuccessRoute({ searchParams }: Props) {
  const query = await searchParams;
  if (query.order_id) {
    redirect(`/orders/${query.order_id}?placed=1`);
  }
  redirect("/orders");
}
