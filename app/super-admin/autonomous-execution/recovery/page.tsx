import { renderExecutionEnginePage, executionEngineMetadata } from "@/lib/enterprise-autonomous-execution-engine/page";

const props = { tab: "recovery" as const, title: "Automated Recovery", description: "Pause workflow, collect diagnostics, notify Incident Center, generate repair proposal, and resume after approval." };
export default async function Page() { return renderExecutionEnginePage(props); }
export async function generateMetadata() { return executionEngineMetadata("Auto Recovery"); }
