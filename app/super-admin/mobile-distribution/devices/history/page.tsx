import { deviceLifecycleMetadata, renderDeviceLifecyclePage } from "@/lib/device-lifecycle-manager-engine/page";

export default async function SuperAdminDeviceLifecycleHistoryPage() {
  return renderDeviceLifecyclePage({ tab: "history", title: "Device History", description: "Login, security, authentication, and update history." });
}

export async function generateMetadata() {
  return deviceLifecycleMetadata("Device History");
}
