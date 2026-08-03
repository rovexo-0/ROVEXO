import { renderExecutionEnginePage, executionEngineMetadata } from "@/lib/enterprise-autonomous-execution-engine/page";

const props = { tab: "dashboard" as const, title: "Enterprise Autonomous Execution Engine", description: "Live execution dashboard — running workflows, approval gates, and platform readiness." };
export default async function Page() { return renderExecutionEnginePage(props); }
export async function generateMetadata() { return executionEngineMetadata("Execution Board"); }
