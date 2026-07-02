import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = { tab: "listings" as const, title: "Listing Validation", description: "Validate image, price, title, badges, trust indicators, wishlist, share, and quick preview." };
export default async function Page() { return renderHomepageCertificationPage(props); }
export async function generateMetadata() { return homepageCertificationMetadata("Listings"); }
