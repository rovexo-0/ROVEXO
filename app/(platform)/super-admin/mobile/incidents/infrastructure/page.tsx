import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "infrastructure",
    title: "Infrastructure Incidents",
    description: "API, database, network, and server incidents.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Infrastructure Incidents");
}
