import { PlatformStudio } from "@/features/super-admin/platform-studio/PlatformStudio";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getPlatformStudioSnapshot } from "@/lib/platform-studio/engine";

export default async function SuperAdminPlatformStudioPage() {
  const snapshot = await getPlatformStudioSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Platform Studio"
        description="No-code administration for forms, workflows, dashboards, automations, permissions, database fields, and pages."
      />
      <PlatformStudio initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Platform Studio | ROVEXO",
    robots: { index: false, follow: false },
  };
}
