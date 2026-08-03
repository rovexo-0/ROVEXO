import { renderMobileCcPage, mobileCcMetadata } from "@/lib/enterprise-mobile-control-center/page";

export default async function SuperAdminMobileDevicesPage() {
  return renderMobileCcPage({ tab: "devices", title: "Device Management", description: "Online devices, health, security, and remote actions." });
}

export async function generateMetadata() {
  return mobileCcMetadata("Device Management");
}
