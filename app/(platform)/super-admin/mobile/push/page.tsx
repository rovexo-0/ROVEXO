import { renderMobileCcPage, mobileCcMetadata } from "@/lib/enterprise-mobile-control-center/page";

export default async function SuperAdminMobilePushPage() {
  return renderMobileCcPage({ tab: "push", title: "Push Center", description: "Broadcast, emergency, and maintenance push notifications." });
}

export async function generateMetadata() {
  return mobileCcMetadata("Push Center");
}
