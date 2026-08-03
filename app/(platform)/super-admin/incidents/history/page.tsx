import { renderIncidentResponsePage, incidentResponseMetadata } from "@/lib/incident-response-center/page";

export default async function SuperAdminIncidentHistoryPage() {
  return renderIncidentResponsePage({
    tab: "history",
    title: "Incident History",
    description: "Complete incident history and audit trail.",
  });
}

export async function generateMetadata() {
  return incidentResponseMetadata("History");
}
