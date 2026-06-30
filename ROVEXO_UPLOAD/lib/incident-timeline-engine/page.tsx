import { IncidentTimelineAdmin, type IncidentTimelineTab } from "@/features/super-admin/incident-timeline/IncidentTimelineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getIncidentTimelinePageData } from "@/lib/incident-timeline-engine/reader";

type IncidentTimelinePageProps = {
  tab: IncidentTimelineTab;
  title: string;
  description: string;
};

export async function renderIncidentTimelinePage({ tab, title, description }: IncidentTimelinePageProps) {
  const { snapshot } = await getIncidentTimelinePageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <IncidentTimelineAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function incidentTimelineMetadata(title: string) {
  return { title: `${title} | Incident Timeline | ROVEXO`, robots: { index: false, follow: false } };
}
