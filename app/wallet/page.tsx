import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { WalletEngineHub } from "@/features/wallet-engine/WalletEngineHub";
import { fetchWalletData } from "@/lib/wallet/queries";
import { WALLET_ENGINE_MODULES } from "@/lib/wallet-engine/registry";
import {
  getPublicWalletEngineConfig,
  getWalletEngineAnalyticsForUser,
  getWalletEngineContext,
} from "@/lib/wallet-engine/reader";
import { fetchProfile } from "@/lib/profile/queries";
import { syncConnectAccountBySellerId } from "@/lib/stripe/connect";
import { redirect } from "next/navigation";

type WalletRouteProps = {
  searchParams: Promise<{ connect?: string }>;
};

export default async function WalletRoute({ searchParams }: WalletRouteProps) {
  const profile = await fetchProfile();

  if (!profile.isSeller) {
    redirect("/account");
  }

  const params = await searchParams;
  if (params.connect === "success" || params.connect === "refresh") {
    await syncConnectAccountBySellerId(profile.id);
  }

  const [data, config, context, analytics] = await Promise.all([
    fetchWalletData(),
    getPublicWalletEngineConfig(),
    getWalletEngineContext(profile.id, "seller"),
    getWalletEngineAnalyticsForUser(profile.id),
  ]);

  return (
    <BetaAppShell showBottomNav={false}>
      <WalletEngineHub
        profile={profile}
        data={data}
        config={config}
        context={context}
        modules={WALLET_ENGINE_MODULES}
        analytics={analytics}
        backHref="/seller/dashboard"
        connectMessage={
          params.connect === "success"
            ? "Stripe Connect setup saved. Payouts will transfer automatically after each hold period."
            : params.connect === "refresh"
              ? "Continue Stripe Connect setup to receive automatic payouts."
              : undefined
        }
      />
    </BetaAppShell>
  );
}

export async function generateMetadata() {
  return {
    title: "Wallet | ROVEXO",
    robots: { index: false, follow: false },
  };
}
