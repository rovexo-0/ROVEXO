import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = { tab: "buttons" as const, title: "Button Validation", description: "Verify tap, hover, focus, keyboard navigation, redirect, loading, success, error, and offline states." };
export default async function Page() { return renderHomepageCertificationPage(props); }
export async function generateMetadata() { return homepageCertificationMetadata("Buttons"); }
