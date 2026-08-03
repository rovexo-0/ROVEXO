import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function Page() {
  return renderBiPage({ tab: "products", title: "Product Analytics", description: "Top categories, products, and marketplace trends." });
}

export async function generateMetadata() {
  return biMetadata("Products");
}
