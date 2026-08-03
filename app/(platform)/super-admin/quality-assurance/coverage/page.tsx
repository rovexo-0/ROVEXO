import { renderQaPage, qaMetadata } from "@/lib/omega-quality-assurance-center/page";

const props = { tab: "coverage" as const, title: "Coverage Analytics", description: "Button, workflow, API, security, performance, SEO, and accessibility coverage." };
export default async function Page() { return renderQaPage(props); }
export async function generateMetadata() { return qaMetadata("Coverage"); }
