import { renderObservabilityPage, observabilityMetadata } from "@/lib/enterprise-observability-center/page";

const props = { tab: "monitoring" as const, title: "Live Platform Monitoring", description: "Continuous monitoring across every ROVEXO subsystem and infrastructure component." };
export default async function Page() { return renderObservabilityPage(props); }
export async function generateMetadata() { return observabilityMetadata("Live Monitoring"); }
