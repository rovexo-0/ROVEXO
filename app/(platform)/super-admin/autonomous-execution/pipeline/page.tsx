import { renderExecutionEnginePage, executionEngineMetadata } from "@/lib/enterprise-autonomous-execution-engine/page";

const props = { tab: "pipeline" as const, title: "Execution Pipeline", description: "Planning through architecture review, development, QA, security, governance, E2E validation, certification, and deployment." };
export default async function Page() { return renderExecutionEnginePage(props); }
export async function generateMetadata() { return executionEngineMetadata("Execution Pipeline"); }
