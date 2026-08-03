import { renderExecutionEnginePage, executionEngineMetadata } from "@/lib/enterprise-autonomous-execution-engine/page";

const props = { tab: "approvals" as const, title: "Enterprise Approval Gates", description: "Require approval before deployment, database migration, payment changes, authentication, and marketplace logic." };
export default async function Page() { return renderExecutionEnginePage(props); }
export async function generateMetadata() { return executionEngineMetadata("Approval Gates"); }
