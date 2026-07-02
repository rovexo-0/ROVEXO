import { renderDevDirectorPage, devDirectorMetadata } from "@/lib/omega-development-director/page";

const props = { tab: "insights" as const, title: "Development Insights", description: "Architecture, performance, security, UX, and maintainability recommendations." };
export default async function Page() { return renderDevDirectorPage(props); }
export async function generateMetadata() { return devDirectorMetadata("Insights"); }
