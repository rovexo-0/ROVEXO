import { Suspense } from "react";
import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";
import { RecentlyViewedPage } from "@/features/account-center/components/RecentlyViewedPage";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Recently Viewed · ROVEXO",
};

async function RecentlyViewedContent() {
  await getProfile();
  return <RecentlyViewedPage />;
}

export default function AccountRecentlyViewedRoute() {
  return (
    <Suspense fallback={<AccountModuleSkeleton />}>
      <RecentlyViewedContent />
    </Suspense>
  );
}
