import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocFirewallPage() {
  return renderSocPage({ tab: "firewall", title: "Firewall Center", description: "IP, country, ASN, and rate limit rules." });
}

export async function generateMetadata() {
  return socMetadata("Firewall");
}
