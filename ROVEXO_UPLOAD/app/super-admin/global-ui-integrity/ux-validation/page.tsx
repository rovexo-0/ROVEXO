import { renderGlobalUiIntegrityPage, globalUiIntegrityMetadata } from "@/lib/omega-global-ui-integrity-engine/page";

const props = { tab: "ux-validation" as const, title: "UX Validation", description: "Click, tap, focus, loading, empty, offline and error state validation." };
export default async function Page() { return renderGlobalUiIntegrityPage(props); }
export async function generateMetadata() { return globalUiIntegrityMetadata("UX Validation"); }
