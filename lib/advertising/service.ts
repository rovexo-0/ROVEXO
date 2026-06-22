import { getProductsBySection } from "@/lib/products/repository";
import type { Product } from "@/lib/products/types";

export type SponsoredSection = {
  id: string;
  title: string;
  surface: "homepage" | "search" | "category";
  products: Product[];
};

export async function getSponsoredSections(): Promise<SponsoredSection[]> {
  const featured = await getProductsBySection("recommended", 1);
  return [
    {
      id: "homepage-featured",
      title: "Sponsored listings",
      surface: "homepage",
      products: featured.items.slice(0, 8),
    },
  ];
}
