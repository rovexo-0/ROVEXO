import { Suspense } from "react";
import { SettingsBankAccountV1 } from "@/features/account-module/components/SettingsV1";
import { privatePageMetadata } from "@/lib/seo/private-metadata";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";

export const metadata = {
  ...privatePageMetadata,
  title: "Bank Account | Settings | ROVEXO",
  description: "Manage your ROVEXO payout bank account.",
};

export default async function SettingsBankAccountRoute({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/account/settings/bank-account");
  }

  const { returnTo } = await searchParams;
  const data = await fetchWalletData();
  const connected = data.withdrawMethods.some(
    (method) => method.provider === "bank_account" && method.connected,
  );

  return (
    <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading…</div>}>
      <SettingsBankAccountV1 connected={connected} returnTo={returnTo ?? null} />
    </Suspense>
  );
}
