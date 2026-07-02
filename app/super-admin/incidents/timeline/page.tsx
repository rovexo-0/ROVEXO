import { incidentTimelineMetadata, renderIncidentTimelinePage } from "@/lib/incident-timeline-engine/page";

export default async function IncidentTimelinePage() {
  return renderIncidentTimelinePage({
    tab: "live",
    title: "Incident Timeline",
    description: "Chronological operational and security event history.",
  });
}

export async function generateMetadata() {
  return incidentTimelineMetadata("Incident Timeline");
}
