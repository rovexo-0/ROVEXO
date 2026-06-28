import { renderDevDirectorPage, devDirectorMetadata } from "@/lib/omega-development-director/page";

const props = { tab: "repair" as const, title: "Safe Repair Mode", description: "Repair proposals with validation gates — never bypasses protected areas." };
export default async function Page() { return renderDevDirectorPage(props); }
export async function generateMetadata() { return devDirectorMetadata("Safe Repair"); }
