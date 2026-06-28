import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocPage() {
  return renderSocPage({
    tab: "dashboard",
    title: "Security Operations Center",
    description: "Enterprise cyber security platform — threat detection, firewall, scanner, and compliance.",
  });
}

export async function generateMetadata() {
  return socMetadata("Dashboard");
}
