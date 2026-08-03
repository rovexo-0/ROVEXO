import { renderLaunchReadinessPage, launchReadinessMetadata } from "@/lib/enterprise-launch-readiness-engine/page";

const props = { tab: "dashboard" as const, title: "Launch Board", description: "Enterprise Launch Readiness dashboard — operational validation before every production release." };
export default async function Page() { return renderLaunchReadinessPage(props); }
export async function generateMetadata() { return launchReadinessMetadata("Launch Board"); }
