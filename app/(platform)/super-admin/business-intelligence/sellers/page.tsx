import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function Page() {
  return renderBiPage({ tab: "sellers", title: "Seller Analytics", description: "Top sellers and seller performance leaderboards." });
}

export async function generateMetadata() {
  return biMetadata("Sellers");
}
