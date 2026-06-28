import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseMobileControlCenterAdmin } from "@/features/super-admin/enterprise-mobile-control-center/EnterpriseMobileControlCenterAdmin";
import { getMobileCcPageData } from "@/lib/enterprise-mobile-control-center/reader";
import type { MobileCcTab } from "@/lib/enterprise-mobile-control-center/types";

type MobileCcPageProps = {
  tab: MobileCcTab;
  title: string;
  description: string;
};

export async function renderMobileCcPage({ tab, title, description }: MobileCcPageProps) {
  const { snapshot } = await getMobileCcPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseMobileControlCenterAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function mobileCcMetadata(title: string) {
  return { title: `${title} · Mobile Control Center` };
}
