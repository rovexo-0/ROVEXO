import { renderIncidentResponsePage, incidentResponseMetadata } from "@/lib/incident-response-center/page";

export default async function SuperAdminIncidentResponsePage() {
  return renderIncidentResponsePage({
    tab: "dashboard",
    title: "Incident Response Center",
    description: "Enterprise incident management — detection, response, root cause, and postmortem.",
  });
}

export async function generateMetadata() {
  return incidentResponseMetadata("Dashboard");
}
