import type { Metadata } from "next";
import { AboutPage } from "@/features/about/AboutPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About ROVEXO",
  description: "ROVEXO is a UK marketplace to buy and sell. One account. Clear Help, Legal, and Support.",
  path: "/about",
});

export default function AboutUsRoute() {
  return <AboutPage />;
}
