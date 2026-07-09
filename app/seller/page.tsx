import { Suspense } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { AccountCenterModulePage } from "@/features/account-center/components/AccountCenterModulePage";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Selling · ROVEXO",
  description: "Listings, orders, wallet, analytics, and selling tools.",
};

async function SellingModuleContent() {
  await getProfile();

  return (
    <AccountCenterModulePage
      moduleId="selling"
      description="Listings, fulfillment, wallet, and growth tools."
    />
  );
}

export default function SellerPage() {
  return (
    <BetaAppShell bottomNavTab="sell" className="account-center-shell">
      <main className="mx-auto w-full max-w-[480px] pb-[calc(84px+env(safe-area-inset-bottom))]">
        <Suspense fallback={null}>
          <SellingModuleContent />
        </Suspense>
      </main>
    </BetaAppShell>
  );
}
