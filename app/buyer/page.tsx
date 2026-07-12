import { Suspense } from "react";
import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";
import { AccountCenterModulePage } from "@/features/account-center/components/AccountCenterModulePage";
import { fetchProfile } from "@/lib/profile/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Buying · ROVEXO",
  description: "Orders, messages, saved items, and marketplace tools.",
};

async function BuyingModuleContent() {
  await fetchProfile();
  return <AccountCenterModulePage moduleId="buying" />;
}

export default function BuyerPage() {
  return (
    <Suspense fallback={<AccountModuleSkeleton />}>
      <BuyingModuleContent />
    </Suspense>
  );
}
