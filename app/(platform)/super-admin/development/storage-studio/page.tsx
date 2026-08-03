import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "storage-studio" as const, title: "Storage Studio", description: "Buckets, assets, usage, lifecycle, and integrity." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Storage Studio"); }
