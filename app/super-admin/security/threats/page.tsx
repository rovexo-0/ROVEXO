import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocThreatsPage() {
  return renderSocPage({ tab: "threats", title: "Threat Intelligence", description: "IP reputation, geo risk, VPN/TOR/bot detection." });
}

export async function generateMetadata() {
  return socMetadata("Threats");
}
