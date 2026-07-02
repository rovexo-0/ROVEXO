import { renderExecutionEnginePage, executionEngineMetadata } from "@/lib/enterprise-autonomous-execution-engine/page";

const props = { tab: "tasks" as const, title: "OMEGA Task Manager", description: "Task queue, priority queue, dependencies, blocked tasks, retry and recovery queues." };
export default async function Page() { return renderExecutionEnginePage(props); }
export async function generateMetadata() { return executionEngineMetadata("Task Manager"); }
