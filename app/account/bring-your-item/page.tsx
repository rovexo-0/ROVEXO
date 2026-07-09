import type { Metadata } from "next";
import { Suspense } from "react";
import { BringYourItemPage } from "@/features/account-module/components/BringYourItemPage";
import { BringYourItemComingSoonPage } from "@/features/account-module/components/BringYourItemComingSoonPage";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Bring Your Item | ROVEXO",
  description: "Import your eBay listings directly into ROVEXO.",
};

export default async function AccountBringYourItemRoute() {
  if (!isStoreMigrationEnabled()) {
    await getProfile();
    return <BringYourItemComingSoonPage />;
  }

  await getProfile();

  return (
    <Suspense fallback={null}>
      <BringYourItemPage />
    </Suspense>
  );
}
