import { renderObservabilityPage, observabilityMetadata } from "@/lib/enterprise-observability-center/page";

const props = { tab: "telemetry" as const, title: "Real-Time Telemetry", description: "CPU, memory, API latency, error rates, queue latency, and infrastructure metrics." };
export default async function Page() { return renderObservabilityPage(props); }
export async function generateMetadata() { return observabilityMetadata("Telemetry"); }
