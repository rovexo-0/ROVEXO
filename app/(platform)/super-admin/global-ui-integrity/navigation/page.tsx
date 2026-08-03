import { renderGlobalUiIntegrityPage, globalUiIntegrityMetadata } from "@/lib/omega-global-ui-integrity-engine/page";

const props = { tab: "navigation" as const, title: "Navigation", description: "Buttons, menus, routes, breadcrumbs, modals and deep-link chain validation." };
export default async function Page() { return renderGlobalUiIntegrityPage(props); }
export async function generateMetadata() { return globalUiIntegrityMetadata("Navigation"); }
