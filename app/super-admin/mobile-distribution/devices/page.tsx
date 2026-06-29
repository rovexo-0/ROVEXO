import { deviceLifecycleMetadata, renderDeviceLifecyclePage } from "@/lib/device-lifecycle-manager-engine/page";

export default async function SuperAdminDeviceLifecycleDashboardPage() {
  return renderDeviceLifecyclePage({
    tab: "dashboard",
    title: "Device Lifecycle Manager",
    description: "Enterprise device registration, trust, health, security, and certification.",
  });
}

export async function generateMetadata() {
  return deviceLifecycleMetadata("Device Lifecycle Manager");
}
