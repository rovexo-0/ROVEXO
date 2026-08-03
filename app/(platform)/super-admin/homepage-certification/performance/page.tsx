import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = { tab: "performance" as const, title: "Performance Validation", description: "Measure LCP, interaction latency, image optimization, bundle size, lazy loading, and memory usage." };
export default async function Page() { return renderHomepageCertificationPage(props); }
export async function generateMetadata() { return homepageCertificationMetadata("Performance"); }
