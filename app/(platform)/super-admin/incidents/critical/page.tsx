import { renderIncidentResponsePage, incidentResponseMetadata } from "@/lib/incident-response-center/page";

export default async function SuperAdminCriticalIncidentsPage() {
  return renderIncidentResponsePage({
    tab: "critical",
    title: "Critical Incidents",
    description: "Critical severity incidents requiring immediate attention.",
  });
}

export async function generateMetadata() {
  return incidentResponseMetadata("Critical");
}
