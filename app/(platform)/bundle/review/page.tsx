import type { Metadata } from "next";
import { BundleReviewPage } from "@/features/bundle/BundleReviewPage";

export const metadata: Metadata = {
  title: "Review Bundle | ROVEXO",
  robots: { index: false, follow: false },
};

export default function BundleReviewRoutePage() {
  return <BundleReviewPage />;
}
