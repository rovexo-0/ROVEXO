import { renderAiOsPage, aiOsMetadata } from "@/lib/enterprise-ai-operating-system/page";

export default async function SuperAdminAiHistoryPage() {
  return renderAiOsPage({
    tab: "history",
    title: "AI History",
    description: "Configuration publish history and AI operation timeline.",
  });
}

export async function generateMetadata() {
  return aiOsMetadata("History");
}
