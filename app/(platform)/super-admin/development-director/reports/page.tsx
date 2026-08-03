import { renderDevDirectorPage, devDirectorMetadata } from "@/lib/omega-development-director/page";

const props = { tab: "reports" as const, title: "Reports & Export", description: "Development board metrics, audit history, and exportable reports." };
export default async function Page() { return renderDevDirectorPage(props); }
export async function generateMetadata() { return devDirectorMetadata("Reports"); }
