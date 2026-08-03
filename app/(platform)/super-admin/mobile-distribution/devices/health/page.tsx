import { deviceLifecycleMetadata, renderDeviceLifecyclePage } from "@/lib/device-lifecycle-manager-engine/page";

export default async function SuperAdminDeviceLifecycleHealthPage() {
  return renderDeviceLifecyclePage({ tab: "health", title: "Device Health", description: "Battery, storage, performance, and connectivity monitoring." });
}

export async function generateMetadata() {
  return deviceLifecycleMetadata("Device Health");
}
