import { renderGovernancePage, governanceMetadata } from "@/lib/enterprise-governance-center/page";

const props = { tab: "technical-debt" as const, title: "Technical Debt Center", description: "Architecture, security, performance, and enterprise debt scoring." };
export default async function Page() { return renderGovernancePage(props); }
export async function generateMetadata() { return governanceMetadata("Technical Debt"); }
