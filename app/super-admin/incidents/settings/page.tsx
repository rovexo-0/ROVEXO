import { renderIncidentResponsePage, incidentResponseMetadata } from "@/lib/incident-response-center/page";

export default async function SuperAdminIncidentSettingsPage() {
  return renderIncidentResponsePage({
    tab: "settings",
    title: "Incident Settings",
    description: "Automation rules, emergency mode, and export controls.",
  });
}

export async function generateMetadata() {
  return incidentResponseMetadata("Settings");
}
