import { renderHomepageBuilderPage, homepageBuilderMetadata } from "@/lib/homepage-builder-engine/page";

export default async function HomepageBuilderPreviewPage() {
  return renderHomepageBuilderPage({ tab: "preview", title: "Live Preview", description: "Multi-device homepage preview." });
}

export async function generateMetadata() {
  return homepageBuilderMetadata("Preview");
}
