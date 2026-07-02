import { renderDevDirectorPage, devDirectorMetadata } from "@/lib/omega-development-director/page";

const props = { tab: "discovery" as const, title: "Development Discovery", description: "Detect missing modules, pages, workflows, tests, and incomplete implementations." };
export default async function Page() { return renderDevDirectorPage(props); }
export async function generateMetadata() { return devDirectorMetadata("Discovery"); }
