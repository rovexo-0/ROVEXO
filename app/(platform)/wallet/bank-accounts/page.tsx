import { Suspense } from "react";
import { WalletBankAccountsPage } from "@/features/wallet/components/WalletBankAccountsPage";
import { privatePageMetadata } from "@/lib/seo/private-metadata";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { getBusinessProfile } from "@/lib/profile/data";
import { normalizeSellerContext } from "@/lib/seller-context/seller-context-v1";
import { syncConnectAccountBySellerId } from "@/lib/stripe/connect";
import { redirect } from "next/navigation";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export const metadata = {
  ...privatePageMetadata,
  title: "Bank Accounts | Balance | ROVEXO",
  description: "Manage personal and business UK payout bank accounts securely with Stripe.",
};

export default async function WalletBankAccountsRoute({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; sellerContext?: string; connect?: string }>;
}) {
  const {
    returnTo,
    sellerContext: sellerContextRaw,
    connect,
  } = await searchParams;
  const sellerContext = normalizeSellerContext(sellerContextRaw);
  const shouldSync = connect === "success" || connect === "refresh";

  if (sellerContext === "business") {
    const profile = await getBusinessProfile();
    if (shouldSync) {
      await syncConnectAccountBySellerId(profile.id, "business");
    }
    const data = await fetchWalletData("business");
    return (
      <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading…</div>}>
        <WalletBankAccountsPage
          personalConnected={false}
          personalLastDigits={null}
          connectStatus={data.connectStatus}
          isBusinessVerified
          returnTo={returnTo ?? WALLET_ROUTES.businessHub}
          sellerContext="business"
          connectMessage={
            connect === "success"
              ? "Business payout account updated."
              : connect === "refresh"
                ? "Finish setting up your business payout account on Stripe."
                : null
          }
        />
      </Suspense>
    );
  }

  const profile = await fetchProfile();
  if (!profile) {
    redirect(`/login?next=${WALLET_ROUTES.bankAccounts}`);
  }

  if (shouldSync) {
    await syncConnectAccountBySellerId(profile.id, "individual");
  }

  const data = await fetchWalletData("individual");
  const personalReady =
    data.connectStatus.connected && data.connectStatus.payoutsEnabled;

  return (
    <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading…</div>}>
      <WalletBankAccountsPage
        personalConnected={personalReady}
        personalLastDigits={null}
        connectStatus={data.connectStatus}
        isBusinessVerified={false}
        returnTo={returnTo ?? null}
        sellerContext="individual"
        connectMessage={
          connect === "success"
            ? "Individual payout account updated."
            : connect === "refresh"
              ? "Finish setting up your Individual payout account on Stripe."
              : null
        }
      />
    </Suspense>
  );
}
