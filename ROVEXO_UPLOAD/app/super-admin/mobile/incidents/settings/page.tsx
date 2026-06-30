import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "settings",
    title: "Incident Settings",
    description: "Push notifications, filters, and command configuration.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Incident Settings");
}
