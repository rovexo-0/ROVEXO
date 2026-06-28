import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function Page() {
  return renderBiPage({ tab: "dashboard", title: "Executive Dashboard", description: "Executive summary with revenue, GMV, and platform health." });
}

export async function generateMetadata() {
  return biMetadata("Executive Dashboard");
}
