import { renderGovernancePage, governanceMetadata } from "@/lib/enterprise-governance-center/page";

const props = { tab: "audit" as const, title: "Audit Center", description: "Searchable audit trail for architecture, deployments, AI, and security." };
export default async function Page() { return renderGovernancePage(props); }
export async function generateMetadata() { return governanceMetadata("Audit"); }
