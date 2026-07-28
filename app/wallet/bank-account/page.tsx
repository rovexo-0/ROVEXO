import { redirect } from "next/navigation";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

/**
 * Legacy singular bank-account path → Bank Accounts hub (Wallet v2 SSOT).
 */
export default async function WalletBankAccountLegacyRedirect({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.returnTo) qs.set("returnTo", params.returnTo);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`${WALLET_ROUTES.bankAccounts}${suffix}`);
}
