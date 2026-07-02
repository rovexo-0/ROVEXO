import { renderGovernancePage, governanceMetadata } from "@/lib/enterprise-governance-center/page";

const props = { tab: "architecture" as const, title: "Architecture Governance", description: "Real-time architecture validation and violation detection." };
export default async function Page() { return renderGovernancePage(props); }
export async function generateMetadata() { return governanceMetadata("Architecture"); }
