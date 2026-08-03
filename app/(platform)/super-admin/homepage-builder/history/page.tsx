import { renderHomepageBuilderPage, homepageBuilderMetadata } from "@/lib/homepage-builder-engine/page";

export default async function HomepageBuilderHistoryPage() {
  return renderHomepageBuilderPage({ tab: "history", title: "History", description: "Version history and audit trail." });
}

export async function generateMetadata() {
  return homepageBuilderMetadata("History");
}
