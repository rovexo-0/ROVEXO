import { notFound, redirect } from "next/navigation";
import { SellScreen } from "@/features/sell/ui/SellScreen";
import { requireAuthContext } from "@/lib/auth/session";
import { sellerListingToDraft } from "@/lib/listings/draft-mapper";
import { getSellerListingById } from "@/lib/listings/repository";
import { getProfile } from "@/lib/profile/data";

type EditListingRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function EditListingRoute({ params }: EditListingRouteProps) {
  const profile = await getProfile();
  if (!profile.isSeller) {
    redirect("/account");
  }

  const { id } = await params;
  const { user } = await requireAuthContext();
  const listing = await getSellerListingById(user.id, id);

  if (!listing) {
    notFound();
  }

  const initialDraft = await sellerListingToDraft(listing);

  return (
    <SellScreen
      editListingId={listing.id}
      initialDraft={initialDraft}
    />
  );
}
