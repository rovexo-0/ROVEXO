import { renderObservabilityPage, observabilityMetadata } from "@/lib/enterprise-observability-center/page";

const props = { tab: "omega" as const, title: "OMEGA Integration", description: "Health events, telemetry, alerts, and diagnostics feed OMEGA for prioritization." };
export default async function Page() { return renderObservabilityPage(props); }
export async function generateMetadata() { return observabilityMetadata("OMEGA Integration"); }
