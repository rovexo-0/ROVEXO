import { renderGlobalUiIntegrityPage, globalUiIntegrityMetadata } from "@/lib/omega-global-ui-integrity-engine/page";

const props = { tab: "auto-repair" as const, title: "Auto Repair", description: "Safe automatic repairs with governance approval gates for protected areas." };
export default async function Page() { return renderGlobalUiIntegrityPage(props); }
export async function generateMetadata() { return globalUiIntegrityMetadata("Auto Repair"); }
