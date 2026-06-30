import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function Page() {
  return renderBiPage({ tab: "settings", title: "BI Settings", description: "KPI periods, live updates, and scheduled reports." });
}

export async function generateMetadata() {
  return biMetadata("Settings");
}
