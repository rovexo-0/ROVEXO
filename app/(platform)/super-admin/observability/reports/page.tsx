import { renderObservabilityPage, observabilityMetadata } from "@/lib/enterprise-observability-center/page";

const props = { tab: "reports" as const, title: "Report Center", description: "Health, performance, availability, infrastructure, and telemetry reports with export." };
export default async function Page() { return renderObservabilityPage(props); }
export async function generateMetadata() { return observabilityMetadata("Reports"); }
