import { renderGovernancePage, governanceMetadata } from "@/lib/enterprise-governance-center/page";

const props = { tab: "compliance" as const, title: "Enterprise Compliance", description: "Module compliance status across all enterprise categories." };
export default async function Page() { return renderGovernancePage(props); }
export async function generateMetadata() { return governanceMetadata("Compliance"); }
