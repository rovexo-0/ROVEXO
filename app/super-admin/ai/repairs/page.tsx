import { renderAiOsPage, aiOsMetadata } from "@/lib/enterprise-ai-operating-system/page";

export default async function SuperAdminAiRepairsPage() {
  return renderAiOsPage({
    tab: "repairs",
    title: "Repair Queue",
    description: "Self-healing repair plans requiring super admin approval.",
  });
}

export async function generateMetadata() {
  return aiOsMetadata("Repair Queue");
}
