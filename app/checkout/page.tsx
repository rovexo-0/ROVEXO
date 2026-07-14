import { redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/session";
import { getAcceptedOfferByIdForSessionBuyer } from "@/lib/offers/accepted-price";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Deep-link `/checkout?offerId=` from notifications — resolve accepted offer
 * and send the buyer to `/checkout/{slug}?offerId=` so locked price applies.
 */
export default async function CheckoutIndexRoute({ searchParams }: Props) {
  const query = searchParams ? await searchParams : {};
  const rawOfferId = query.offerId;
  const offerId = Array.isArray(rawOfferId) ? rawOfferId[0] : rawOfferId;

  if (offerId) {
    try {
      const { user } = await requireAuthContext();
      const locked = await getAcceptedOfferByIdForSessionBuyer(offerId, user.id);
      if (locked?.productSlug) {
        redirect(
          `/checkout/${encodeURIComponent(locked.productSlug)}?offerId=${encodeURIComponent(locked.offerId)}`,
        );
      }
    } catch {
      // Fall through to cart when unauthenticated / missing offer.
    }
  }

  redirect("/cart");
}
