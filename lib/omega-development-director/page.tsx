import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { OmegaDevelopmentDirectorAdmin } from "@/features/super-admin/omega-development-director/OmegaDevelopmentDirectorAdmin";
import { getDevDirectorPageData } from "@/lib/omega-development-director/reader";
import type { DevDirectorTab } from "@/lib/omega-development-director/types";

type DevDirectorPageProps = { tab: DevDirectorTab; title: string; description: string };

export async function renderDevDirectorPage({ tab, title, description }: DevDirectorPageProps) {
  const { snapshot } = await getDevDirectorPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <OmegaDevelopmentDirectorAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function devDirectorMetadata(title: string) {
  return { title: `${title} · OMEGA Development Director` };
}
