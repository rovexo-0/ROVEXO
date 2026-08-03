import { renderMobileCcPage, mobileCcMetadata } from "@/lib/enterprise-mobile-control-center/page";

export default async function SuperAdminMobileAndroidPage() {
  return renderMobileCcPage({ tab: "android", title: "Android Center", description: "Google Play tracks, signing, and bundle versions." });
}

export async function generateMetadata() {
  return mobileCcMetadata("Android Center");
}
