import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MigrationCenterPage } from "@/features/seller/migration/components/MigrationCenterPage";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getProfile } from "@/lib/profile/data";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Import Your Store",
  description: "Import products from your favourite marketplaces and migrate your store to ROVEXO.",
  path: "/import",
  noIndex: true,
});

export default async function ImportWizardRoute() {
  if (!isStoreMigrationEnabled()) {
    redirect("/seller");
  }

  await getProfile();

  return (
    <Suspense fallback={null}>
      <MigrationCenterPage />
    </Suspense>
  );
}
