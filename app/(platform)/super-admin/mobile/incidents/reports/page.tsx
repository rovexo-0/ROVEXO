import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "reports",
    title: "Incident Reports",
    description: "Generate and export incident reports.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Incident Reports");
}
