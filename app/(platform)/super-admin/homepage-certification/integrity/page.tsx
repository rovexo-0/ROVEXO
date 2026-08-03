import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = {
  tab: "integrity" as const,
  title: "Homepage Integrity",
  description: "OMEGA Update 066.1 — category duplication detection, layout optimization, and search bar gap certification.",
};
export default async function Page() {
  return renderHomepageCertificationPage(props);
}
export async function generateMetadata() {
  return homepageCertificationMetadata("Integrity");
}
