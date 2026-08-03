import { FeatureManagerPanel } from "@/features/super-admin/mission-control/FeatureManagerPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMissionControlSnapshot } from "@/lib/super-admin/mission-control/snapshot";

export default async function SuperAdminFeaturesPage() {
  const snapshot = await getMissionControlSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Feature Manager"
        description="Enable, disable, beta, or maintenance-rollout every marketplace module."
      />
      <FeatureManagerPanel initialFeatures={snapshot.features} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Feature Manager | Mission Control | ROVEXO",
    robots: { index: false, follow: false },
  };
}
