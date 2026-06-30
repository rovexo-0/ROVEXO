import { renderLaunchReadinessPage, launchReadinessMetadata } from "@/lib/enterprise-launch-readiness-engine/page";

const props = { tab: "performance" as const, title: "Performance", description: "Core Web Vitals, bundle size, latency and render validation." };
export default async function Page() { return renderLaunchReadinessPage(props); }
export async function generateMetadata() { return launchReadinessMetadata("Performance"); }
