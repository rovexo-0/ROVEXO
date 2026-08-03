import { incidentTimelineMetadata, renderIncidentTimelinePage } from "@/lib/incident-timeline-engine/page";

export default async function IncidentTimelinePage() {
  return renderIncidentTimelinePage({
    tab: "search",
    title: "Search Timeline",
    description: "Search and filter incident timeline events.",
  });
}

export async function generateMetadata() {
  return incidentTimelineMetadata("Search Timeline");
}
