import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MigrationCenterPage } from "@/features/seller/migration/components/MigrationCenterPage";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getProfile } from "@/lib/profile/data";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Migration Center",
  description: "Import products from your favourite marketplaces and migrate your store to ROVEXO.",
  path: "/seller/migration",
  noIndex: true,
});

export default async function SellerMigrationRoute() {
  if (!isStoreMigrationEnabled()) {
    redirect("/seller");
  }

  const profile = await getProfile();
  if (!profile.isSeller) {
    redirect("/account");
  }

  return <MigrationCenterPage />;
}
