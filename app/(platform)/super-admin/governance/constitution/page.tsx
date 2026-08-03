import { renderGovernancePage, governanceMetadata } from "@/lib/enterprise-governance-center/page";

const props = { tab: "constitution" as const, title: "Enterprise Constitution", description: "Official constitution viewer with version history and amendments." };
export default async function Page() { return renderGovernancePage(props); }
export async function generateMetadata() { return governanceMetadata("Constitution"); }
