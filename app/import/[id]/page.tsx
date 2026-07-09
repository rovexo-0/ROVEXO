import { redirect } from "next/navigation";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getMigrationJobForSeller } from "@/lib/seller/migration/repository";
import { getProfile } from "@/lib/profile/data";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Legacy job detail path — inline engine lives at /account/bring-your-item?job={id}. */
export default async function ImportJobRoute({ params }: PageProps) {
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
