import { deviceLifecycleMetadata, renderDeviceLifecyclePage } from "@/lib/device-lifecycle-manager-engine/page";

export default async function SuperAdminDeviceLifecycleSecurityPage() {
  return renderDeviceLifecyclePage({ tab: "security", title: "Device Security", description: "Encryption, certificates, tamper detection, and enterprise protection." });
}

export async function generateMetadata() {
  return deviceLifecycleMetadata("Device Security");
}
