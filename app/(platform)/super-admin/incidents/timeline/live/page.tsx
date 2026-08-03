import { incidentTimelineMetadata, renderIncidentTimelinePage } from "@/lib/incident-timeline-engine/page";

export default async function IncidentTimelinePage() {
  return renderIncidentTimelinePage({
    tab: "live",
    title: "Live Timeline",
    description: "Live chronological incident feed with real-time updates.",
  });
}

export async function generateMetadata() {
  return incidentTimelineMetadata("Live Timeline");
}
