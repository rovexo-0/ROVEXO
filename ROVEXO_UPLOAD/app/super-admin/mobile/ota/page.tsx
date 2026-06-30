import { renderMobileCcPage, mobileCcMetadata } from "@/lib/enterprise-mobile-control-center/page";

export default async function SuperAdminMobileOtaPage() {
  return renderMobileCcPage({ tab: "ota", title: "OTA Update Center", description: "Gradual rollouts, emergency updates, and rollbacks." });
}

export async function generateMetadata() {
  return mobileCcMetadata("OTA Update Center");
}
