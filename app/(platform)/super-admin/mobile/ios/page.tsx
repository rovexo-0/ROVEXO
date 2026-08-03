import { renderMobileCcPage, mobileCcMetadata } from "@/lib/enterprise-mobile-control-center/page";

export default async function SuperAdminMobileIosPage() {
  return renderMobileCcPage({ tab: "ios", title: "iOS Center", description: "TestFlight, App Store, certificates, and signing." });
}

export async function generateMetadata() {
  return mobileCcMetadata("iOS Center");
}
