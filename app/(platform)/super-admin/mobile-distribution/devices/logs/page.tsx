import { deviceLifecycleMetadata, renderDeviceLifecyclePage } from "@/lib/device-lifecycle-manager-engine/page";

export default async function SuperAdminDeviceLifecycleLogsPage() {
  return renderDeviceLifecyclePage({ tab: "logs", title: "Device Logs", description: "OMEGA, Guardian, and Sentinel device event logs." });
}

export async function generateMetadata() {
  return deviceLifecycleMetadata("Device Logs");
}
