import { IncidentCommandCenterAdmin, type IncidentCommandTab } from "@/features/super-admin/incident-command-center/IncidentCommandCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getIncidentCommandPageData } from "@/lib/incident-command-center-engine/reader";

type IncidentCommandPageProps = {
  tab: IncidentCommandTab;
  title: string;
  description: string;
};

export async function renderIncidentCommandPage({ tab, title, description }: IncidentCommandPageProps) {
  const { snapshot } = await getIncidentCommandPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <IncidentCommandCenterAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function incidentCommandMetadata(title: string) {
  return { title: `${title} | Incident Command | ROVEXO`, robots: { index: false, follow: false } };
}
