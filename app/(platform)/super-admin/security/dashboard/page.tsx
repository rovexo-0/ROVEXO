import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocDashboardPage() {
  return renderSocPage({
    tab: "dashboard",
    title: "SOC Dashboard",
    description: "Enterprise security score, threat level, and live monitoring widgets.",
  });
}

export async function generateMetadata() {
  return socMetadata("Dashboard");
}
