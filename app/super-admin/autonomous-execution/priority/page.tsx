import { renderExecutionEnginePage, executionEngineMetadata } from "@/lib/enterprise-autonomous-execution-engine/page";

const props = { tab: "priority" as const, title: "Smart Priority Engine", description: "Business impact, security risk, certification impact, and platform stability prioritization." };
export default async function Page() { return renderExecutionEnginePage(props); }
export async function generateMetadata() { return executionEngineMetadata("Priority Engine"); }
