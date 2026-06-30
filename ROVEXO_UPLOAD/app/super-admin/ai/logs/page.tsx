import { renderAiOsPage, aiOsMetadata } from "@/lib/enterprise-ai-operating-system/page";

export default async function SuperAdminAiLogsPage() {
  return renderAiOsPage({
    tab: "logs",
    title: "AI Logs",
    description: "Audit trail for scans, analysis, repairs, and configuration changes.",
  });
}

export async function generateMetadata() {
  return aiOsMetadata("AI Logs");
}
