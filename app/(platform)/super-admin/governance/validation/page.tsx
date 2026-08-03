import { renderGovernancePage, governanceMetadata } from "@/lib/enterprise-governance-center/page";

const props = { tab: "validation" as const, title: "Validation Center", description: "Full enterprise validation pipeline through SCAN, SENTINEL, OMEGA, and certification." };
export default async function Page() { return renderGovernancePage(props); }
export async function generateMetadata() { return governanceMetadata("Validation"); }
