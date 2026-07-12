import type { Metadata } from "next";
import { HelpFaqPage } from "@/features/help/components/HelpFaqPage";

export const metadata: Metadata = {
  title: "FAQ | ROVEXO Help Center",
  description: "Frequently asked questions across ROVEXO buyer, seller, business, and payment topics.",
};

export default function HelpFaqRoute() {
  return <HelpFaqPage />;
}
