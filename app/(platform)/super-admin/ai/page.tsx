import { renderAiOsPage, aiOsMetadata } from "@/lib/enterprise-ai-operating-system/page";

export default async function SuperAdminAiPage() {
  return renderAiOsPage({
    tab: "dashboard",
    title: "Enterprise AI Operating System",
    description: "SCAN • SENTINEL • OMEGA — central enterprise AI command center.",
  });
}

export async function generateMetadata() {
  return aiOsMetadata("Command Center");
}
