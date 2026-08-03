import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getMigrationJobForSeller } from "@/lib/seller/migration/repository";
import { getProfile } from "@/lib/profile/data";
import { buildPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return buildPageMetadata({
    title: "Import Job",
    description: "Review and publish imported listings.",
    path: `${BRING_YOUR_ITEM_PATH}?job=${id}`,
    noIndex: true,
  });
}

/** Legacy seller migration job path — forwards to My Account Bring Your Item. */
export default async function SellerMigrationJobRoute({ params }: PageProps) {
  if (!isStoreMigrationEnabled()) {
    redirect("/account");
  }

  const profile = await getProfile();
  const { id } = await params;
  const job = await getMigrationJobForSeller(profile.id, id);
  if (!job) {
    redirect(BRING_YOUR_ITEM_PATH);
  }

  redirect(`${BRING_YOUR_ITEM_PATH}?job=${id}`);
}
