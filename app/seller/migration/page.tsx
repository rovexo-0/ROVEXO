import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isStoreMigrationEnabled, MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import { getProfile } from "@/lib/profile/data";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Bring Your Item",
  description: "Import products from your favourite marketplaces and migrate your store to ROVEXO.",
  path: MIGRATION_CENTER_PATH,
  noIndex: true,
});

export default async function SellerMigrationRoute() {
  if (!isStoreMigrationEnabled()) {
    redirect("/account");
  }

  await getProfile();

  redirect(MIGRATION_CENTER_PATH);
}
