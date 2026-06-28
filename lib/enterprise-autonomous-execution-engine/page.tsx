import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseAutonomousExecutionAdmin } from "@/features/super-admin/enterprise-autonomous-execution-engine/EnterpriseAutonomousExecutionAdmin";
import { getExecutionEnginePageData } from "@/lib/enterprise-autonomous-execution-engine/reader";
import type { ExecutionEngineTab } from "@/lib/enterprise-autonomous-execution-engine/types";

type ExecutionEnginePageProps = { tab: ExecutionEngineTab; title: string; description: string };

export async function renderExecutionEnginePage({ tab, title, description }: ExecutionEnginePageProps) {
  const { snapshot } = await getExecutionEnginePageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseAutonomousExecutionAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function executionEngineMetadata(title: string) {
  return { title: `${title} · Autonomous Execution Engine` };
}
