"use client";

import { MobileHubSections } from "@/features/mobile-ui";
import { getCategoriesNavSections } from "@/lib/mobile-ui/hubs";

export function CategoriesMobileNav() {
  return <MobileHubSections sections={getCategoriesNavSections()} />;
}
