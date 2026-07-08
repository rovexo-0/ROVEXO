import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "@/styles/rovexo/header-v2.css";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { PromotionCardsPage } from "@/components/promotions/cards-v1";
import { getResolvedPromotionCatalog } from "@/lib/promotions/catalog";
import { fetchSellerListings } from "@/lib/seller/listings-queries";
import { getProfile } from "@/lib/profile/data";

export const metadata: Metadata = {
  title: "Promote your listing or store",
  description:
    "Choose Bump, Featured, Boost, Premium, or Store Featured promotions to reach more buyers on ROVEXO.",
};

export default async function SellerPromotionsRoute() {
  const [profile, catalog, listingsData] = await Promise.all([
    getProfile(),
    getResolvedPromotionCatalog(),
    fetchSellerListings("published"),
  ]);

  if (!profile.isSeller) {
    redirect("/account");
  }

  return (
    <BetaAppShell showBottomNav={false}>
      <RovexoHeaderV2 />
      <main>
        <PromotionCardsPage catalog={catalog} listings={listingsData.listings} />
      </main>
    </BetaAppShell>
  );
}
