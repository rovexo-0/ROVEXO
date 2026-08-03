import { incidentCommandMetadata, renderIncidentCommandPage } from "@/lib/incident-command-center-engine/page";

export default async function SuperAdminIncidentCommandPage() {
  return renderIncidentCommandPage({
    tab: "emergency",
    title: "Emergency Center",
    description: "Protected emergency actions with MFA and audit logging.",
  });
}

export async function generateMetadata() {
  return incidentCommandMetadata("Emergency Center");
}
