import { renderMobileCcPage, mobileCcMetadata } from "@/lib/enterprise-mobile-control-center/page";

export default async function SuperAdminMobileBuildsPage() {
  return renderMobileCcPage({ tab: "builds", title: "Build Center", description: "Android and iOS build pipeline." });
}

export async function generateMetadata() {
  return mobileCcMetadata("Build Center");
}
