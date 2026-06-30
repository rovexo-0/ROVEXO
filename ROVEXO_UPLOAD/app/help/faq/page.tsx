import type { Metadata } from "next";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HelpFaqPage } from "@/features/help/components/HelpFaqPage";

export const metadata: Metadata = {
  title: "FAQ | ROVEXO Help Center",
  description: "Frequently asked questions across ROVEXO buyer, seller, business, and payment topics.",
};

export default function HelpFaqRoute() {
  return (
    <BetaAppShell showBottomNav={false}>
      <HelpFaqPage />
    </BetaAppShell>
  );
}
