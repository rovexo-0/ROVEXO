import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocVulnerabilitiesPage() {
  return renderSocPage({ tab: "vulnerabilities", title: "Vulnerabilities", description: "Open security vulnerabilities and remediation status." });
}

export async function generateMetadata() {
  return socMetadata("Vulnerabilities");
}
