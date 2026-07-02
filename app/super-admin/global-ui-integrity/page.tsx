import { renderGlobalUiIntegrityPage, globalUiIntegrityMetadata } from "@/lib/omega-global-ui-integrity-engine/page";

const props = { tab: "dashboard" as const, title: "Integrity Board", description: "Global UI Integrity dashboard — PASS 100% across the entire ROVEXO platform." };
export default async function Page() { return renderGlobalUiIntegrityPage(props); }
export async function generateMetadata() { return globalUiIntegrityMetadata("Integrity Board"); }
