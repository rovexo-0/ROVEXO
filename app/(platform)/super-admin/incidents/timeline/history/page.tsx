import { incidentTimelineMetadata, renderIncidentTimelinePage } from "@/lib/incident-timeline-engine/page";

export default async function IncidentTimelinePage() {
  return renderIncidentTimelinePage({
    tab: "history",
    title: "Timeline History",
    description: "Resolved and closed incident history.",
  });
}

export async function generateMetadata() {
  return incidentTimelineMetadata("Timeline History");
}
