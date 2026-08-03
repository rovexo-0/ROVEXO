import { renderHomepageBuilderPage, homepageBuilderMetadata } from "@/lib/homepage-builder-engine/page";

export default async function HomepageBuilderSettingsPage() {
  return renderHomepageBuilderPage({ tab: "settings", title: "Settings", description: "Homepage builder settings and feature flags." });
}

export async function generateMetadata() {
  return homepageBuilderMetadata("Settings");
}
