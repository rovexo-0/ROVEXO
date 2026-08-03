import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth/session";
import { listProtectionCasesForUser, type ProtectionCaseType } from "@/lib/protection/service";
import { privatePageMetadata } from "@/lib/seo/private-metadata";
import { ResolutionCentreView } from "@/features/resolution/components/ResolutionCentreView";

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Resolution Centre",
  description: "Manage refund requests, returns, and purchase protection cases on ROVEXO.",
};

type ResolutionSearchParams = Promise<{ type?: string }>;

function parseFilterType(value: string | undefined): ProtectionCaseType | null {
  if (value === "refund" || value === "dispute" || value === "return" || value === "appeal") {
    return value;
  }
  return null;
}

export default async function ResolutionCentrePage({
  searchParams,
}: {
  searchParams: ResolutionSearchParams;
}) {
  const auth = await requireAuthContext();
  const params = await searchParams;
  const filterType = parseFilterType(params.type);
  const [buyerCases, sellerCases] = await Promise.all([
    listProtectionCasesForUser(auth.user.id, "buyer"),
    listProtectionCasesForUser(auth.user.id, "seller"),
  ]);

  return (
    <ResolutionCentreView
      buyerCases={buyerCases}
      sellerCases={sellerCases}
      filterType={filterType}
    />
  );
}
