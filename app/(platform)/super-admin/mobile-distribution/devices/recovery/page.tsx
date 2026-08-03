import { deviceLifecycleMetadata, renderDeviceLifecyclePage } from "@/lib/device-lifecycle-manager-engine/page";

export default async function SuperAdminDeviceLifecycleRecoveryPage() {
  return renderDeviceLifecyclePage({ tab: "recovery", title: "Device Recovery", description: "Remote recovery actions integrated with Disaster Recovery Engine." });
}

export async function generateMetadata() {
  return deviceLifecycleMetadata("Device Recovery");
}
