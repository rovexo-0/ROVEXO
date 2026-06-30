import { renderDevDirectorPage, devDirectorMetadata } from "@/lib/omega-development-director/page";

const props = { tab: "analysis" as const, title: "Code Analysis", description: "Continuous codebase analysis across routes, components, APIs, and enterprise modules." };
export default async function Page() { return renderDevDirectorPage(props); }
export async function generateMetadata() { return devDirectorMetadata("Code Analysis"); }
