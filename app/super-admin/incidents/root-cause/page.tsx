import { renderIncidentResponsePage, incidentResponseMetadata } from "@/lib/incident-response-center/page";

export default async function SuperAdminRootCausePage() {
  return renderIncidentResponsePage({
    tab: "root-cause",
    title: "Root Cause Analysis",
    description: "AI-powered root cause analysis with SCAN, SENTINEL, and OMEGA.",
  });
}

export async function generateMetadata() {
  return incidentResponseMetadata("Root Cause Analysis");
}
