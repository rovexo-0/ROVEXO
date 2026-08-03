import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "critical",
    title: "Critical Incidents",
    description: "Critical severity incidents requiring immediate action.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Critical Incidents");
}
