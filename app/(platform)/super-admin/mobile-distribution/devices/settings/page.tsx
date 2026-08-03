import { deviceLifecycleMetadata, renderDeviceLifecyclePage } from "@/lib/device-lifecycle-manager-engine/page";

export default async function SuperAdminDeviceLifecycleSettingsPage() {
  return renderDeviceLifecyclePage({ tab: "settings", title: "Device Lifecycle Settings", description: "Authentication, biometric requirements, and OMEGA monitoring." });
}

export async function generateMetadata() {
  return deviceLifecycleMetadata("Device Lifecycle Settings");
}
