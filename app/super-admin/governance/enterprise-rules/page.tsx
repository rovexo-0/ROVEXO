import { renderGovernancePage, governanceMetadata } from "@/lib/enterprise-governance-center/page";

const props = { tab: "enterprise-rules" as const, title: "Enterprise Rules", description: "Live rule engine evaluating modules, APIs, configs, and navigation." };
export default async function Page() { return renderGovernancePage(props); }
export async function generateMetadata() { return governanceMetadata("Enterprise Rules"); }
