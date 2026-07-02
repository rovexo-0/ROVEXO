import { MissionControlCenterV2 } from "@/features/super-admin/mission-control/MissionControlCenterV2";
import { getMissionControlV2PageDataFromSnapshot } from "@/lib/mission-control-engine/reader";
import { getMissionControlSnapshot } from "@/lib/super-admin/mission-control/snapshot";

export default async function SuperAdminHomePage() {
  const snapshot = await getMissionControlSnapshot();
  const { context, sections, quickActions } = await getMissionControlV2PageDataFromSnapshot(snapshot);

  return (
    <MissionControlCenterV2
      snapshot={snapshot}
      context={context}
      sections={sections}
      quickActions={quickActions}
    />
  );
}

export async function generateMetadata() {
  return {
    title: "Mission Control | ROVEXO",
    robots: { index: false, follow: false },
  };
}
