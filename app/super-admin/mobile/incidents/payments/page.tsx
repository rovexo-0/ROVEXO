import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "payments",
    title: "Payment Incidents",
    description: "Payment and transaction incidents.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Payment Incidents");
}
