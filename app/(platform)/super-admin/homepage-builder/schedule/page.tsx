import { renderHomepageBuilderPage, homepageBuilderMetadata } from "@/lib/homepage-builder-engine/page";

export default async function HomepageBuilderSchedulePage() {
  return renderHomepageBuilderPage({ tab: "schedule", title: "Schedule", description: "Scheduled homepage publishing." });
}

export async function generateMetadata() {
  return homepageBuilderMetadata("Schedule");
}
