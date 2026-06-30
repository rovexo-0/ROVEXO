import { renderGovernancePage, governanceMetadata } from "@/lib/enterprise-governance-center/page";

const props = { tab: "enterprise-score" as const, title: "Enterprise Score", description: "Live enterprise score across architecture, security, marketplace, and more." };
export default async function Page() { return renderGovernancePage(props); }
export async function generateMetadata() { return governanceMetadata("Enterprise Score"); }
