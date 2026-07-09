import { Suspense } from "react";
import { HubPageMain } from "@/components/layout/HubPageMain";
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
      <HubPageMain className="mx-auto w-full max-w-[480px] ">
        <Suspense fallback={null}>
          <SellingModuleContent />
        </Suspense>
      </HubPageMain>
    </BetaAppShell>
  );
}
