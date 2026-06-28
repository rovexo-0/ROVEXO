import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocLivePage() {
  return renderSocPage({ tab: "live", title: "Live Security Events", description: "Real-time security event monitoring." });
}

export async function generateMetadata() {
  return socMetadata("Live Events");
}
