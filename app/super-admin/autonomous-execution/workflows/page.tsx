import { renderExecutionEnginePage, executionEngineMetadata } from "@/lib/enterprise-autonomous-execution-engine/page";

const props = { tab: "workflows" as const, title: "Autonomous Workflow Engine", description: "Development, bug fix, certification, deployment, monitoring, and review workflows." };
export default async function Page() { return renderExecutionEnginePage(props); }
export async function generateMetadata() { return executionEngineMetadata("Workflows"); }
