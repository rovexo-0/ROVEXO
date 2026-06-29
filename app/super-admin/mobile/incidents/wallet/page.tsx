import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "wallet",
    title: "Wallet Incidents",
    description: "Wallet and withdrawal incidents.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Wallet Incidents");
}
