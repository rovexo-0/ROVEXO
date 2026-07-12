import { Suspense } from "react";
import { AccountCenterModulePage } from "@/features/account-center/components/AccountCenterModulePage";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Selling · ROVEXO",
  description: "Listings, orders, wallet, analytics, and selling tools.",
};

async function SellingModuleContent() {
  await getProfile();
  return <AccountCenterModulePage moduleId="selling" />;
}

export default function SellerPage() {
  return (
    <Suspense fallback={null}>
      <SellingModuleContent />
    </Suspense>
  );
}
