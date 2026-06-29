import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "identity",
    title: "Identity Incidents",
    description: "Identity and authentication incidents.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Identity Incidents");
}
