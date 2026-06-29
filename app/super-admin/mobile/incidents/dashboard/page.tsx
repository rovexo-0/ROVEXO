import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "dashboard",
    title: "Incident Dashboard",
    description: "Live incident dashboard with smart priority and analytics.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Incident Dashboard");
}
