import { redirect } from "next/navigation";
import { loadCheckoutPageProps } from "@/features/checkout/lib/load-checkout-page";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order_id?: string }>;
};

/** Sprint 1 success — redirect to Orders when possible; otherwise back to checkout. */
export default async function CheckoutSuccessRoute({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  if (query.order_id) {
    redirect(`/orders/${query.order_id}?placed=1`);
  }

  await loadCheckoutPageProps(slug);
  redirect(`/checkout/${slug}`);
}
