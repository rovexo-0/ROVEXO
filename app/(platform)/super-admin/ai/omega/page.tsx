import { renderAiOsPage, aiOsMetadata } from "@/lib/enterprise-ai-operating-system/page";

export default async function SuperAdminAiOmegaPage() {
  return renderAiOsPage({
    tab: "omega",
    title: "Omega Center",
    description: "Enterprise AI brain — recommendations, scheduling, and repair planning.",
  });
}

export async function generateMetadata() {
  return aiOsMetadata("Omega Center");
}
