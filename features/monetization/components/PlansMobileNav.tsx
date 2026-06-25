"use client";

import { MobileHubSections } from "@/features/mobile-ui";
import { getPlansHubSections } from "@/lib/mobile-ui/hubs";

export function PlansMobileNav() {
  return <MobileHubSections sections={getPlansHubSections()} />;
}
