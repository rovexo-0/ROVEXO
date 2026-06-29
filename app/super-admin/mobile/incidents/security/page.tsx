import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "security",
    title: "Security Incidents",
    description: "Guardian, Sentinel, antivirus, and authentication incidents.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Security Incidents");
}
