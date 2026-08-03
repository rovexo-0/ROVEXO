import { renderObservabilityPage, observabilityMetadata } from "@/lib/enterprise-observability-center/page";

const props = { tab: "timeline" as const, title: "Historical Timeline", description: "Immutable history of outages, incidents, deployments, performance, and security events." };
export default async function Page() { return renderObservabilityPage(props); }
export async function generateMetadata() { return observabilityMetadata("Historical Timeline"); }
