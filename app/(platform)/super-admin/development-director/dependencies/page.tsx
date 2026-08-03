import { renderDevDirectorPage, devDirectorMetadata } from "@/lib/omega-development-director/page";

const props = { tab: "dependencies" as const, title: "Dependency Graph", description: "Live dependency mapping with circular dependency and broken import detection." };
export default async function Page() { return renderDevDirectorPage(props); }
export async function generateMetadata() { return devDirectorMetadata("Dependencies"); }
