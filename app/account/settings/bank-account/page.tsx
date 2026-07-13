import { redirect } from "next/navigation";
import { WALLET_ROUTES, walletRouteWithReturn } from "@/lib/wallet/canonical-routes";

export default async function SettingsBankAccountRedirect({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  redirect(walletRouteWithReturn(WALLET_ROUTES.bankAccount, returnTo ?? null));
}
