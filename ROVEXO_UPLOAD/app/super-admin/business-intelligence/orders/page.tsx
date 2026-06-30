import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function Page() {
  return renderBiPage({ tab: "orders", title: "Order Analytics", description: "Order volume, GMV, and conversion metrics." });
}

export async function generateMetadata() {
  return biMetadata("Orders");
}
