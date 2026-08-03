import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "live",
    title: "Live Incidents",
    description: "Real-time incident feed with live refresh.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Live Incidents");
}
