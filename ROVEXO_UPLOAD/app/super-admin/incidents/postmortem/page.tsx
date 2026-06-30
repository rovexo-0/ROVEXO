import { renderIncidentResponsePage, incidentResponseMetadata } from "@/lib/incident-response-center/page";

export default async function SuperAdminIncidentPostmortemPage() {
  return renderIncidentResponsePage({
    tab: "postmortem",
    title: "Postmortem Reports",
    description: "Automatic postmortem generation with PDF export.",
  });
}

export async function generateMetadata() {
  return incidentResponseMetadata("Postmortem");
}
