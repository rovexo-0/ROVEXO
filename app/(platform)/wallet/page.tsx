import { WalletPage } from "@/features/wallet/components/WalletPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { syncConnectAccountBySellerId } from "@/lib/stripe/connect";
import { isBusinessVerifiedAccount } from "@/lib/verified/evaluate";
import { SUPREME_BLOOD_CODE_XIII_V1 } from "@/lib/supreme-blood-code-xiii-v1";
import { redirect } from "next/navigation";

type WalletRouteProps = {
  searchParams: Promise<{ connect?: string }>;
};

/**
 * Sprint IV — Blood XIII: official Wallet hub entry `http://localhost:3000/wallet`.
 * One feature = one entry point = one implementation (WalletPage / WalletHubV1).
 */
export default async function WalletRoute({ searchParams }: WalletRouteProps) {
  void SUPREME_BLOOD_CODE_XIII_V1.officialRoute;
  const profile = await fetchProfile();

  if (!profile) {
    redirect("/login?next=/wallet");
  }

  const params = await searchParams;
  if (profile.isSeller && (params.connect === "success" || params.connect === "refresh")) {
    await syncConnectAccountBySellerId(profile.id);
  }

  const [data, isBusinessVerified] = await Promise.all([
    fetchWalletData(),
    isBusinessVerifiedAccount(profile.id).catch(() => false),
  ]);

  return (
    <WalletPage
      data={data}
      userId={profile.id}
      backHref="/account"
      variant="personal"
      isBusinessVerified={isBusinessVerified}
      connectMessage={
        params.connect === "success"
          ? "Bank account setup saved. Payouts will be sent automatically after each hold period."
          : params.connect === "refresh"
            ? "Finish setting up your bank account to receive automatic payouts."
            : undefined
      }
    />
  );
}

export async function generateMetadata() {
  return {
    title: "Balance | ROVEXO",
    robots: { index: false, follow: false },
  };
}
