import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "performance" as const, title: "Performance Center", description: "Bundle, rendering, memory, caching, and network metrics." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Performance Center"); }
