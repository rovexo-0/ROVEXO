import { renderHomepageBuilderPage, homepageBuilderMetadata } from "@/lib/homepage-builder-engine/page";

export default async function HomepageBuilderComponentsPage() {
  return renderHomepageBuilderPage({ tab: "components", title: "Component Library", description: "Reusable homepage components." });
}

export async function generateMetadata() {
  return homepageBuilderMetadata("Components");
}
