import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { IncidentResponseCenterAdmin } from "@/features/super-admin/incident-response-center/IncidentResponseCenterAdmin";
import { getIncidentPageData } from "@/lib/incident-response-center/reader";
import type { IncidentTab } from "@/lib/incident-response-center/types";

type IncidentPageProps = {
  tab: IncidentTab;
  title: string;
  description: string;
};

export async function renderIncidentResponsePage({ tab, title, description }: IncidentPageProps) {
  const { snapshot } = await getIncidentPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <IncidentResponseCenterAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function incidentResponseMetadata(title: string) {
  return { title: `${title} · Incident Response Center` };
}
