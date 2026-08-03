import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "dashboard",
    title: "Incident Command Center",
    description: "Enterprise notification and incident command for all platform events.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Incident Command Center");
}
