import { redirect } from "next/navigation";
import { IMPORT_WIZARD_PATH, isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getMigrationJobForSeller } from "@/lib/seller/migration/repository";
import { getProfile } from "@/lib/profile/data";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Legacy job detail path — inline engine lives at /import?job={id}. */
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
    redirect(IMPORT_WIZARD_PATH);
  }

  redirect(`${IMPORT_WIZARD_PATH}?job=${id}`);
}
