"use client";

import { MobileHubSections } from "@/features/mobile-ui";
import { getSupportHubSections } from "@/lib/mobile-ui/hubs";

export function HelpMobileNav() {
  return <MobileHubSections sections={getSupportHubSections()} />;
}
