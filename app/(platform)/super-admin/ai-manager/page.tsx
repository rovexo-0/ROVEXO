import { AiManagerPanel } from "@/features/super-admin/mission-control/AiManagerPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMissionControlSnapshot } from "@/lib/super-admin/mission-control/snapshot";

export default async function SuperAdminAiManagerPage() {
  const snapshot = await getMissionControlSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="AI Manager"
        description="Global AI and per-feature toggles. Local execution is preferred whenever technically possible."
      />
      <AiManagerPanel initialGlobalEnabled={snapshot.ai.globalEnabled} initialFeatures={snapshot.ai.features} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "AI Manager | Mission Control | ROVEXO",
    robots: { index: false, follow: false },
  };
}
