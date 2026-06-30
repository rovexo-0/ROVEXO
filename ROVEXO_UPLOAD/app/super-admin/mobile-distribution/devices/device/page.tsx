import { deviceLifecycleMetadata, renderDeviceLifecyclePage } from "@/lib/device-lifecycle-manager-engine/page";

type PageProps = { searchParams: Promise<{ id?: string }> };

export default async function SuperAdminDeviceLifecycleDetailPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  return renderDeviceLifecyclePage({
    tab: "device",
    title: "Device Detail",
    description: "Full device registration and certification profile.",
    selectedDeviceId: id,
  });
}

export async function generateMetadata() {
  return deviceLifecycleMetadata("Device Detail");
}
