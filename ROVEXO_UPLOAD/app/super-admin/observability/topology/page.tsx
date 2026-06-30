import { renderObservabilityPage, observabilityMetadata } from "@/lib/enterprise-observability-center/page";

const props = { tab: "topology" as const, title: "Live Topology Map", description: "Applications, services, modules, APIs, workers, queues, and dependency relationships." };
export default async function Page() { return renderObservabilityPage(props); }
export async function generateMetadata() { return observabilityMetadata("Topology Map"); }
