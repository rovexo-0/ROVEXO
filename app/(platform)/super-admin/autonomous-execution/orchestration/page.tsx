import { renderExecutionEnginePage, executionEngineMetadata } from "@/lib/enterprise-autonomous-execution-engine/page";

const props = { tab: "orchestration" as const, title: "Enterprise Orchestration", description: "Coordinate OMEGA Command Center, AI OS, Development Director, QA, Observability, Governance, Security, and Deployment modules." };
export default async function Page() { return renderExecutionEnginePage(props); }
export async function generateMetadata() { return executionEngineMetadata("Orchestration"); }
