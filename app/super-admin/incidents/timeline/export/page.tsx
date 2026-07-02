import { incidentTimelineMetadata, renderIncidentTimelinePage } from "@/lib/incident-timeline-engine/page";

export default async function IncidentTimelinePage() {
  return renderIncidentTimelinePage({
    tab: "export",
    title: "Export Timeline",
    description: "Generate audit-ready timeline exports.",
  });
}

export async function generateMetadata() {
  return incidentTimelineMetadata("Export Timeline");
}
