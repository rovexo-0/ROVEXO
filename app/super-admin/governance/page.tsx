import { renderGovernancePage, governanceMetadata } from "@/lib/enterprise-governance-center/page";

export default async function SuperAdminGovernancePage() {
  return renderGovernancePage({ tab: "constitution", title: "Enterprise Governance Center", description: "Official Enterprise Constitution and governance authority." });
}

export async function generateMetadata() {
  return governanceMetadata("Constitution");
}
