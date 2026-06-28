import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = { tab: "accessibility" as const, title: "Accessibility Validation", description: "Verify ARIA, keyboard, screen readers, focus order, contrast, font scaling, and reduced motion." };
export default async function Page() { return renderHomepageCertificationPage(props); }
export async function generateMetadata() { return homepageCertificationMetadata("Accessibility"); }
