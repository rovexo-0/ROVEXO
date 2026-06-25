"use client";

import { MobileHubSections } from "@/features/mobile-ui";
import { getWholesaleHubSections } from "@/lib/mobile-ui/hubs";

export function WholesaleMobileNav() {
  return <MobileHubSections sections={getWholesaleHubSections()} />;
}
