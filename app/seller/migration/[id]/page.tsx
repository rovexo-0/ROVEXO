import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IMPORT_WIZARD_PATH, isStoreMigrationEnabled } from "@/lib/seller/migration/config";
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
    path: `${IMPORT_WIZARD_PATH}/${id}`,
    noIndex: true,
  });
}

export default async function SellerMigrationJobRoute({ params }: PageProps) {
  if (!isStoreMigrationEnabled()) {
    redirect("/seller");
  }

  const profile = await getProfile();
  if (!profile.isSeller) {
    redirect("/account");
  }

  const { id } = await params;
  redirect(`${IMPORT_WIZARD_PATH}/${id}`);
}
