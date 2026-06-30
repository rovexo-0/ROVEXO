import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function SuperAdminBiPage() {
  return renderBiPage({ tab: "dashboard", title: "Business Intelligence Center", description: "Executive analytics and decision-making platform." });
}

export async function generateMetadata() {
  return biMetadata("Dashboard");
}
