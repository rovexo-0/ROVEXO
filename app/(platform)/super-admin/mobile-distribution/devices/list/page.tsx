import { deviceLifecycleMetadata, renderDeviceLifecyclePage } from "@/lib/device-lifecycle-manager-engine/page";

export default async function SuperAdminDeviceLifecycleListPage() {
  return renderDeviceLifecyclePage({ tab: "list", title: "Device List", description: "All registered Super Admin mobile devices." });
}

export async function generateMetadata() {
  return deviceLifecycleMetadata("Device List");
}
