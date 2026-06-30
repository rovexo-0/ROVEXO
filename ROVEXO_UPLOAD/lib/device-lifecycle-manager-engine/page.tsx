import { DeviceLifecycleManagerAdmin, type DeviceLifecycleTab } from "@/features/super-admin/device-lifecycle-manager/DeviceLifecycleManagerAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getDeviceLifecycleManagerPageData } from "@/lib/device-lifecycle-manager-engine/reader";

type DeviceLifecyclePageProps = {
  tab: DeviceLifecycleTab;
  title: string;
  description: string;
  selectedDeviceId?: string;
};

export async function renderDeviceLifecyclePage({ tab, title, description, selectedDeviceId }: DeviceLifecyclePageProps) {
  const { snapshot } = await getDeviceLifecycleManagerPageData();
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <DeviceLifecycleManagerAdmin initialSnapshot={snapshot} defaultTab={tab} selectedDeviceId={selectedDeviceId} />
    </>
  );
}

export function deviceLifecycleMetadata(title: string) {
  return { title: `${title} | ROVEXO`, robots: { index: false, follow: false } };
}
