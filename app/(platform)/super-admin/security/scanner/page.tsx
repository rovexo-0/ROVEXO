import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocScannerPage() {
  return renderSocPage({ tab: "scanner", title: "Security Scanner", description: "Configuration, dependency, secrets, and infrastructure scanning." });
}

export async function generateMetadata() {
  return socMetadata("Scanner");
}
