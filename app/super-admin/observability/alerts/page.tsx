import { renderObservabilityPage, observabilityMetadata } from "@/lib/enterprise-observability-center/page";

const props = { tab: "alerts" as const, title: "Smart Alert Engine", description: "Automatic detection of latency spikes, failures, degradation, and anomalies." };
export default async function Page() { return renderObservabilityPage(props); }
export async function generateMetadata() { return observabilityMetadata("Smart Alerts"); }
