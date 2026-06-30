import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function Page() {
  return renderBiPage({ tab: "reports", title: "Executive Reports", description: "Automated revenue, marketplace, and business reports." });
}

export async function generateMetadata() {
  return biMetadata("Reports");
}
