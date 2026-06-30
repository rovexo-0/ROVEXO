import { renderLaunchReadinessPage, launchReadinessMetadata } from "@/lib/enterprise-launch-readiness-engine/page";

const props = { tab: "marketplace" as const, title: "Marketplace", description: "Homepage, categories, search, listings and workflow validation." };
export default async function Page() { return renderLaunchReadinessPage(props); }
export async function generateMetadata() { return launchReadinessMetadata("Marketplace"); }
