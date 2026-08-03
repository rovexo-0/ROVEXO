import { renderHomepageBuilderPage, homepageBuilderMetadata } from "@/lib/homepage-builder-engine/page";

export default async function HomepageBuilderEditorPage() {
  return renderHomepageBuilderPage({ tab: "editor", title: "Section Editor", description: "Drag-and-drop homepage section editor." });
}

export async function generateMetadata() {
  return homepageBuilderMetadata("Editor");
}
