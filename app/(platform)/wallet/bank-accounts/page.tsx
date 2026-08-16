import { Suspense } from "react";
import { WalletBankAccountsPage } from "@/features/wallet/components/WalletBankAccountsPage";
import { privatePageMetadata } from "@/lib/seo/private-metadata";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { isBusinessVerifiedAccount } from "@/lib/verified/evaluate";
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
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const profile = await fetchProfile();
  if (!profile) {
    redirect(`/login?next=${WALLET_ROUTES.bankAccounts}`);
  }

  const { returnTo } = await searchParams;
  const [data, isBusinessVerified] = await Promise.all([
    fetchWalletData(),
    isBusinessVerifiedAccount(profile.id).catch(() => false),
  ]);
  const personal = data.withdrawMethods.find(
    (method) => method.provider === "bank_account" && method.connected,
  );

  return (
    <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading…</div>}>
      <WalletBankAccountsPage
        personalConnected={Boolean(personal)}
        personalLastDigits={personal?.lastDigits ?? null}
        connectStatus={data.connectStatus}
        isBusinessVerified={isBusinessVerified}
        returnTo={returnTo ?? null}
      />
    </Suspense>
  );
}
