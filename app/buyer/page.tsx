import { Suspense } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BuyerDashboard } from "@/components/buyer/BuyerDashboard";
import { BuyerSkeleton } from "@/components/buyer/BuyerSkeleton";
import { fetchBuyerDashboard } from "@/lib/buyer/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Buyer Dashboard · ROVEXO",
  description: "Manage orders, saved listings, protection, and account settings.",
};

async function BuyerDashboardContent() {
  const data = await fetchBuyerDashboard();
  return <BuyerDashboard data={data} />;
}

export default function BuyerPage() {
  return (
    <BetaAppShell bottomNavTab="account" className="rovexo-page-home">
      <Suspense fallback={<BuyerSkeleton />}>
        <BuyerDashboardContent />
      </Suspense>
    </BetaAppShell>
  );
}
