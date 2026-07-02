import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function Page() {
  return renderBiPage({ tab: "forecasting", title: "AI Forecasting", description: "SCAN, SENTINEL, and OMEGA revenue and growth predictions." });
}

export async function generateMetadata() {
  return biMetadata("Forecasting");
}
