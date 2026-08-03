import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocAuditPage() {
  return renderSocPage({ tab: "audit", title: "Security Audit", description: "Immutable security audit timeline and administrator actions." });
}

export async function generateMetadata() {
  return socMetadata("Audit");
}
