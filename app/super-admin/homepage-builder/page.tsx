import { renderHomepageBuilderPage, homepageBuilderMetadata } from "@/lib/homepage-builder-engine/page";

export default async function SuperAdminHomepageBuilderPage() {
  return renderHomepageBuilderPage({
    tab: "dashboard",
    title: "Homepage Builder",
    description: "Visual CMS Pro v2 — enterprise homepage operating system.",
  });
}

export async function generateMetadata() {
  return homepageBuilderMetadata("Dashboard");
}
