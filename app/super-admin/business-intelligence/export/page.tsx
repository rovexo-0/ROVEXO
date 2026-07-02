import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function Page() {
  return renderBiPage({ tab: "export", title: "Export Center", description: "Export reports as PDF, CSV, Excel, or JSON." });
}

export async function generateMetadata() {
  return biMetadata("Export");
}
