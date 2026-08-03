import { renderExecutionEnginePage, executionEngineMetadata } from "@/lib/enterprise-autonomous-execution-engine/page";

const props = { tab: "reports" as const, title: "Execution Reports", description: "Export execution, workflow, approval, recovery, priority, orchestration, certification, and deployment reports." };
export default async function Page() { return renderExecutionEnginePage(props); }
export async function generateMetadata() { return executionEngineMetadata("Reports"); }
