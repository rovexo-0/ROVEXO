import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { OmegaCommandCenterAdmin } from "@/features/super-admin/omega-command-center/OmegaCommandCenterAdmin";
import { getOmegaPageData } from "@/lib/omega-command-center/reader";

export async function renderOmegaPage({ title, description }: { title: string; description: string }) {
  const { snapshot } = await getOmegaPageData();
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <OmegaCommandCenterAdmin initialSnapshot={snapshot} />
    </>
  );
}

export function omegaMetadata(title: string) {
  return { title: `${title} · OMEGA Command Center` };
}
