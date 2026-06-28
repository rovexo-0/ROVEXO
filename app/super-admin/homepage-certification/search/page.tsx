import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = { tab: "search" as const, title: "Search Validation", description: "Validate search input, suggestions, autocomplete, filters, sorting, and AI assistance." };
export default async function Page() { return renderHomepageCertificationPage(props); }
export async function generateMetadata() { return homepageCertificationMetadata("Search"); }
