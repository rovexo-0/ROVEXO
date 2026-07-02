import { renderMobileCcPage, mobileCcMetadata } from "@/lib/enterprise-mobile-control-center/page";

export default async function SuperAdminMobileControlCenterPage() {
  return renderMobileCcPage({
    tab: "dashboard",
    title: "Mobile Control Center",
    description: "Super Admin mobile app lifecycle — builds, releases, OTA, devices, and push.",
  });
}

export async function generateMetadata() {
  return mobileCcMetadata("Dashboard");
}
