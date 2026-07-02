import { renderGlobalUiIntegrityPage, globalUiIntegrityMetadata } from "@/lib/omega-global-ui-integrity-engine/page";

const props = { tab: "ui-validation" as const, title: "UI Validation", description: "Duplication, spacing, alignment, Premium 2026 consistency across all screens." };
export default async function Page() { return renderGlobalUiIntegrityPage(props); }
export async function generateMetadata() { return globalUiIntegrityMetadata("UI Validation"); }
