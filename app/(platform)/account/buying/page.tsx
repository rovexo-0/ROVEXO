import { Suspense } from "react";
import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";
import { BuyingHubPage } from "@/features/account-center/components/BuyingHubPage";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Buying · ROVEXO",
  description: "Orders, cart, saved items, offers, tracking, returns, and reviews.",
};

async function BuyingContent() {
  await getProfile();
  return <BuyingHubPage />;
}

export default function AccountBuyingPage() {
  return (
    <Suspense fallback={<AccountModuleSkeleton />}>
      <BuyingContent />
    </Suspense>
  );
}
