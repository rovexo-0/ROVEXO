import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MigrationCenterPage } from "@/features/seller/migration/components/MigrationCenterPage";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getProfile } from "@/lib/profile/data";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Bring Your Item",
  description: "Import listings from your favourite marketplaces into ROVEXO.",
  path: BRING_YOUR_ITEM_PATH,
  noIndex: true,
});

export default async function AccountBringYourItemRoute() {
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
