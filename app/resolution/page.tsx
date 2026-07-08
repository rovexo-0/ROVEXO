import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth/session";
import { listProtectionCasesForUser } from "@/lib/protection/service";
import { privatePageMetadata } from "@/lib/seo/private-metadata";
import { ResolutionCentreView } from "@/features/resolution/components/ResolutionCentreView";

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Resolution Centre",
  description: "Manage refund requests, returns, and purchase protection cases on ROVEXO.",
};

export default async function ResolutionCentrePage() {
  const auth = await requireAuthContext();
  const [buyerCases, sellerCases] = await Promise.all([
    listProtectionCasesForUser(auth.user.id, "buyer"),
    listProtectionCasesForUser(auth.user.id, "seller"),
  ]);

  return <ResolutionCentreView buyerCases={buyerCases} sellerCases={sellerCases} />;
}
