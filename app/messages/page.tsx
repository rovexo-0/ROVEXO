import { Suspense } from "react";
import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";
import { MessagesHubPage } from "@/features/account-center/components/MessagesHubPage";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const dynamic = "force-dynamic";

export const metadata = {
  ...privatePageMetadata,
  title: "Messages · ROVEXO",
};

async function MessagesHubContent() {
  await getProfile();
  return <MessagesHubPage />;
}

/** Messages hub — Master Menu (Conversations, Offers, Updates). */
export default function MessagesRoute() {
  return (
    <Suspense fallback={<AccountModuleSkeleton />}>
      <MessagesHubContent />
    </Suspense>
  );
}
