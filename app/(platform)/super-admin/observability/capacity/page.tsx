import { renderObservabilityPage, observabilityMetadata } from "@/lib/enterprise-observability-center/page";

const props = { tab: "capacity" as const, title: "Capacity Planning", description: "Traffic, storage, CPU, memory, database, and infrastructure scaling forecasts." };
export default async function Page() { return renderObservabilityPage(props); }
export async function generateMetadata() { return observabilityMetadata("Capacity Planning"); }
