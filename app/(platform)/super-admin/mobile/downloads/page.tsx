import { renderMobileCcPage, mobileCcMetadata } from "@/lib/enterprise-mobile-control-center/page";

export default async function SuperAdminMobileDownloadsPage() {
  return renderMobileCcPage({ tab: "downloads", title: "Download Center", description: "APK, AAB, QR codes, and release notes." });
}

export async function generateMetadata() {
  return mobileCcMetadata("Download Center");
}
