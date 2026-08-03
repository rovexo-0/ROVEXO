import { renderObservabilityPage, observabilityMetadata } from "@/lib/enterprise-observability-center/page";

const props = { tab: "dashboard" as const, title: "Enterprise Observability Center", description: "Live platform health, availability, enterprise score, and operational overview." };
export default async function Page() { return renderObservabilityPage(props); }
export async function generateMetadata() { return observabilityMetadata("Dashboard"); }
