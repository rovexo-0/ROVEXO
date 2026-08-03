import { renderExecutionEnginePage, executionEngineMetadata } from "@/lib/enterprise-autonomous-execution-engine/page";

const props = { tab: "decisions" as const, title: "OMEGA Decision Support", description: "Recommended next action, estimated completion, risk assessment, business impact, and rollback strategy." };
export default async function Page() { return renderExecutionEnginePage(props); }
export async function generateMetadata() { return executionEngineMetadata("Decision Support"); }
