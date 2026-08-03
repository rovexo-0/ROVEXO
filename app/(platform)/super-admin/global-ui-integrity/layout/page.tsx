import { renderGlobalUiIntegrityPage, globalUiIntegrityMetadata } from "@/lib/omega-global-ui-integrity-engine/page";

const props = { tab: "layout" as const, title: "Layout", description: "Search bar, spacing, safe areas and viewport optimisation across the platform." };
export default async function Page() { return renderGlobalUiIntegrityPage(props); }
export async function generateMetadata() { return globalUiIntegrityMetadata("Layout"); }
