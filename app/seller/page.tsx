import { Suspense } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { AccountCenterModulePage } from "@/features/account-center/components/AccountCenterModulePage";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Seller · ROVEXO",
  description: "Listings, orders, wallet, analytics, and seller tools.",
};

async function SellerModuleContent() {
  const profile = await getProfile();

  return (
    <AccountCenterModulePage
      moduleId="seller"
      profile={profile}
      description="Listings, fulfillment, wallet, and growth tools."
    />
  );
}

export default function SellerPage() {
  return (
    <BetaAppShell bottomNavTab="sell" className="account-center-shell">
      <main className="mx-auto w-full max-w-[480px] pb-[calc(84px+env(safe-area-inset-bottom))]">
        <Suspense fallback={null}>
          <SellerModuleContent />
        </Suspense>
      </main>
    </BetaAppShell>
  );
}
