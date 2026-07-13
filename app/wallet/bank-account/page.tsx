import { Suspense } from "react";
import { WalletBankAccountPage } from "@/features/wallet/components/WalletBankAccountPage";
import { privatePageMetadata } from "@/lib/seo/private-metadata";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export const metadata = {
  ...privatePageMetadata,
  title: "Bank Account | Wallet | ROVEXO",
  description: "Manage your ROVEXO payout bank account.",
};

export default async function WalletBankAccountRoute({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const profile = await fetchProfile();
  if (!profile) {
    redirect(`/login?next=${WALLET_ROUTES.bankAccount}`);
  }

  const { returnTo } = await searchParams;
  const data = await fetchWalletData();
  const connected = data.withdrawMethods.some(
    (method) => method.provider === "bank_account" && method.connected,
  );

  return (
    <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading…</div>}>
      <WalletBankAccountPage connected={connected} returnTo={returnTo ?? null} />
    </Suspense>
  );
}
