import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "compliance",
    title: "Compliance Incidents",
    description: "Compliance and certification incidents.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Compliance Incidents");
}
