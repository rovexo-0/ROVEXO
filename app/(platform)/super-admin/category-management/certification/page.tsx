import { renderCategoryManagementPage, categoryManagementMetadata } from "@/lib/enterprise-category-management-center/page";

const props = { tab: "certification" as const, title: "Category Certification", description: "UI, UX, SEO, accessibility, performance, security, architecture, marketplace, and enterprise scores." };
export default async function Page() { return renderCategoryManagementPage(props); }
export async function generateMetadata() { return categoryManagementMetadata("Certification"); }
