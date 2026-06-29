import { renderWorkflowEnginePage, workflowEngineMetadata } from "@/lib/enterprise-workflow-engine/page";

export default async function SuperAdminWorkflowSchedulerPage() {
  return renderWorkflowEnginePage({
    tab: "scheduler",
    title: "Scheduler",
    description: "Cron and scheduled workflow execution.",
  });
}

export async function generateMetadata() {
  return workflowEngineMetadata("Scheduler");
}
