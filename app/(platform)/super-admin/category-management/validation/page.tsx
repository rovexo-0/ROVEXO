import { renderCategoryManagementPage, categoryManagementMetadata } from "@/lib/enterprise-category-management-center/page";

const props = { tab: "validation" as const, title: "Category Validation", description: "OMEGA validates hierarchy, slug, routing, images, SEO, accessibility, and marketplace rules." };
export default async function Page() { return renderCategoryManagementPage(props); }
export async function generateMetadata() { return categoryManagementMetadata("Validation"); }
