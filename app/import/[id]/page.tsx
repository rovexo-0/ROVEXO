import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MigrationJobDetailPage } from "@/features/seller/migration/components/MigrationJobDetailPage";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getMigrationJobForSeller } from "@/lib/seller/migration/repository";
import { listMigrationItemsForJob } from "@/lib/seller/migration/repository-items";
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
    path: `/import/${id}`,
    noIndex: true,
  });
}

/** Canonical import wizard job detail route. */
export default async function ImportJobRoute({ params }: PageProps) {
  if (!isStoreMigrationEnabled()) {
    redirect("/seller");
  }

  const profile = await getProfile();
  if (!profile.isSeller) {
    redirect("/account");
  }

  const { id } = await params;
  const job = await getMigrationJobForSeller(profile.id, id);
  if (!job) {
    notFound();
  }

  const items = await listMigrationItemsForJob(profile.id, id);

  return <MigrationJobDetailPage jobId={id} initialJob={job} initialItems={items} />;
}
