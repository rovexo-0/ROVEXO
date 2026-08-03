import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function Page() {
  return renderBiPage({ tab: "kpis", title: "KPI Engine", description: "Real-time KPI calculations across daily, weekly, and monthly periods." });
}

export async function generateMetadata() {
  return biMetadata("KPI Engine");
}
