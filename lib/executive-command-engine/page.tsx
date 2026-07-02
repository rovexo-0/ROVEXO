import { ExecutiveCommandAdmin } from "@/features/super-admin/executive-command/ExecutiveCommandAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getExecutiveCommandPageData } from "@/lib/executive-command-engine/reader";

export async function renderExecutiveCommandPage() {
  const { snapshot } = await getExecutiveCommandPageData();
  return (
    <>
      <SuperAdminPageHeader
        title="Executive Command Center"
        description="ORI Executive Intelligence — live platform overview with transparent data availability."
      />
      <ExecutiveCommandAdmin initialSnapshot={snapshot} />
    </>
  );
}

export function executiveCommandMetadata() {
  return { title: "Executive Command | OMEGA | ROVEXO", robots: { index: false, follow: false } };
}
