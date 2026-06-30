import { renderIncidentResponsePage, incidentResponseMetadata } from "@/lib/incident-response-center/page";

export default async function SuperAdminLiveIncidentsPage() {
  return renderIncidentResponsePage({
    tab: "live",
    title: "Live Incidents",
    description: "Real-time incident monitoring and response.",
  });
}

export async function generateMetadata() {
  return incidentResponseMetadata("Live Incidents");
}
