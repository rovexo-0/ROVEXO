import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocCompliancePage() {
  return renderSocPage({ tab: "compliance", title: "Security Compliance", description: "GDPR, MFA compliance, password policy, and security policies." });
}

export async function generateMetadata() {
  return socMetadata("Compliance");
}
