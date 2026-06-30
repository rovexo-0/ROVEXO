import { renderDevDirectorPage, devDirectorMetadata } from "@/lib/omega-development-director/page";

const props = { tab: "dashboard" as const, title: "OMEGA Development Director", description: "Live development progress, enterprise score, and autonomous coordination overview." };
export default async function Page() { return renderDevDirectorPage(props); }
export async function generateMetadata() { return devDirectorMetadata("Dashboard"); }
