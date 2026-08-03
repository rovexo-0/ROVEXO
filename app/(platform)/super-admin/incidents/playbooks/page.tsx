import { renderIncidentResponsePage, incidentResponseMetadata } from "@/lib/incident-response-center/page";

export default async function SuperAdminIncidentPlaybooksPage() {
  return renderIncidentResponsePage({
    tab: "playbooks",
    title: "Response Playbooks",
    description: "One-click incident response actions and runbooks.",
  });
}

export async function generateMetadata() {
  return incidentResponseMetadata("Playbooks");
}
