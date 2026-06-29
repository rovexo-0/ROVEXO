import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "history",
    title: "Incident History",
    description: "Audit timeline of incident actions and resolutions.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Incident History");
}
