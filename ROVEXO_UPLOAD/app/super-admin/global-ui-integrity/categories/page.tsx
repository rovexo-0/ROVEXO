import { renderGlobalUiIntegrityPage, globalUiIntegrityMetadata } from "@/lib/omega-global-ui-integrity-engine/page";

const props = { tab: "categories" as const, title: "Categories", description: "Global category duplication, hierarchy, icons and homepage duplication detection." };
export default async function Page() { return renderGlobalUiIntegrityPage(props); }
export async function generateMetadata() { return globalUiIntegrityMetadata("Categories"); }
