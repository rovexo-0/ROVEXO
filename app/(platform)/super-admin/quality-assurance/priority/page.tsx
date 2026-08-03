import { renderQaPage, qaMetadata } from "@/lib/omega-quality-assurance-center/page";

const props = { tab: "priority" as const, title: "OMEGA Priority Mode", description: "Auto-prioritize broken buttons, redirects, APIs, and accessibility issues." };
export default async function Page() { return renderQaPage(props); }
export async function generateMetadata() { return qaMetadata("Priority"); }
