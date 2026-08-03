import { renderObservabilityPage, observabilityMetadata } from "@/lib/enterprise-observability-center/page";

const props = { tab: "diagnostics" as const, title: "Diagnostics Engine", description: "Automated diagnostics for network, API, database, storage, queues, and infrastructure." };
export default async function Page() { return renderObservabilityPage(props); }
export async function generateMetadata() { return observabilityMetadata("Diagnostics"); }
