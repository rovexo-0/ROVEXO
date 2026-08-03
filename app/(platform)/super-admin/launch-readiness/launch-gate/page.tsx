import { renderLaunchReadinessPage, launchReadinessMetadata } from "@/lib/enterprise-launch-readiness-engine/page";

const props = { tab: "launch-gate" as const, title: "Launch Gate", description: "Production release blockers and launch gate certification." };
export default async function Page() { return renderLaunchReadinessPage(props); }
export async function generateMetadata() { return launchReadinessMetadata("Launch Gate"); }
