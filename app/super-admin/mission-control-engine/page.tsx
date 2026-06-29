import { MissionControlEngineAdmin } from "@/features/super-admin/mission-control-engine/MissionControlEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMissionControlEngineSnapshot } from "@/lib/mission-control-engine/reader";

export default async function SuperAdminMissionControlEnginePage() {
  const snapshot = await getMissionControlEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Mission Control Engine"
        description="Configure enterprise command center sections, widgets, quick actions, monitoring, and productivity controls."
      />
      <MissionControlEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Mission Control Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
