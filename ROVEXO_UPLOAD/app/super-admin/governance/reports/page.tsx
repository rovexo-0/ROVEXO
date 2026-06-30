import { renderGovernancePage, governanceMetadata } from "@/lib/enterprise-governance-center/page";

const props = { tab: "reports" as const, title: "Governance Reports", description: "Export architecture, security, governance, certification, and audit reports." };
export default async function Page() { return renderGovernancePage(props); }
export async function generateMetadata() { return governanceMetadata("Reports"); }
