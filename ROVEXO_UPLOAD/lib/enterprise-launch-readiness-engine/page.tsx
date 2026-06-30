import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseLaunchReadinessAdmin } from "@/features/super-admin/enterprise-launch-readiness-engine/EnterpriseLaunchReadinessAdmin";
import { getLaunchReadinessPageData } from "@/lib/enterprise-launch-readiness-engine/reader";
import type { LaunchReadinessTab } from "@/lib/enterprise-launch-readiness-engine/types";

type LaunchReadinessPageProps = { tab: LaunchReadinessTab; title: string; description: string };

export async function renderLaunchReadinessPage({ tab, title, description }: LaunchReadinessPageProps) {
  const { snapshot } = await getLaunchReadinessPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseLaunchReadinessAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function launchReadinessMetadata(title: string) {
  return { title: `${title} · Enterprise Launch Readiness` };
}
