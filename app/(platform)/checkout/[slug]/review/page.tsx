import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Absolute Final: legacy review URL redirects to single checkout. */
export default async function CheckoutReviewRoute({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const rawOfferId = query.offerId;
  const offerId = Array.isArray(rawOfferId) ? rawOfferId[0] : rawOfferId;
  const qs = offerId ? `?offerId=${encodeURIComponent(offerId)}` : "";
  redirect(`/checkout/${slug}${qs}`);
}
