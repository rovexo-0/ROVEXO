import { renderQaPage, qaMetadata } from "@/lib/omega-quality-assurance-center/page";

const props = { tab: "dashboard" as const, title: "OMEGA Quality Assurance Center", description: "Live platform health, enterprise score, and autonomous validation overview." };
export default async function Page() { return renderQaPage(props); }
export async function generateMetadata() { return qaMetadata("Dashboard"); }
