import { notFound, redirect } from "next/navigation";
import { SellPage } from "@/features/sell/components/SellPage";
import { requireAuthContext } from "@/lib/auth/session";
import { sellerListingToDraft } from "@/lib/listings/draft-mapper";
import { getSellerListingById } from "@/lib/listings/repository";
import { canManageInventory } from "@/lib/profile/account";
import { getProfile } from "@/lib/profile/data";

type EditListingRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function EditListingRoute({ params }: EditListingRouteProps) {
  const profile = await getProfile();
  const role = profile.accountType;

  if (role !== "seller" && role !== "business" && role !== "admin") {
    redirect("/account");
  }

  const { id } = await params;
  const { user } = await requireAuthContext();
  const listing = await getSellerListingById(user.id, id);

  if (!listing) {
    notFound();
  }

  const manageInventory = canManageInventory(profile.accountType);
  const initialDraft = await sellerListingToDraft(listing, manageInventory);

  return (
    <SellPage
      manageInventory={manageInventory}
      editListingId={listing.id}
      initialDraft={initialDraft}
    />
  );
}
