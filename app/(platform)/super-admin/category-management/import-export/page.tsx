import { renderCategoryManagementPage, categoryManagementMetadata } from "@/lib/enterprise-category-management-center/page";

const props = { tab: "import-export" as const, title: "Import / Export", description: "CSV, Excel, JSON backup, restore, preview import, and conflict detection." };
export default async function Page() { return renderCategoryManagementPage(props); }
export async function generateMetadata() { return categoryManagementMetadata("Import Export"); }
