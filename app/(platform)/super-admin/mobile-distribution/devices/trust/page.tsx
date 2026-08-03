import { deviceLifecycleMetadata, renderDeviceLifecyclePage } from "@/lib/device-lifecycle-manager-engine/page";

export default async function SuperAdminDeviceLifecycleTrustPage() {
  return renderDeviceLifecyclePage({ tab: "trust", title: "Trust Score", description: "Authentication health, integrity, and risk analysis." });
}

export async function generateMetadata() {
  return deviceLifecycleMetadata("Trust Score");
}
