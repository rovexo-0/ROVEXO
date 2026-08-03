import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "registry-explorer" as const, title: "Registry Explorer", description: "Enterprise Registry V2 module discovery." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Registry Explorer"); }
