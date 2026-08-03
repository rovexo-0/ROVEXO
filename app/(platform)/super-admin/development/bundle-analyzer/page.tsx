import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "bundle-analyzer" as const, title: "Bundle Analyzer", description: "Bundle size, tree shaking, and lazy loading analysis." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Bundle Analyzer"); }
