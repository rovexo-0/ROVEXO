import { WalletPage } from "@/features/wallet/components/WalletPage";
import { fetchWalletCommerceSummary, fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { syncConnectAccountBySellerId } from "@/lib/stripe/connect";
import { redirect } from "next/navigation";

type WalletRouteProps = {
  searchParams: Promise<{ connect?: string }>;
};

export default async function WalletRoute({ searchParams }: WalletRouteProps) {
  const profile = await fetchProfile();

  if (!profile) {
    redirect("/login?next=/wallet");
  }

  const params = await searchParams;
  if (params.connect === "success" || params.connect === "refresh") {
    await syncConnectAccountBySellerId(profile.id);
  }

  const data = await fetchWalletData();
  const commerceSummary = await fetchWalletCommerceSummary();

  return (
    <WalletPage
      data={data}
      commerceSummary={commerceSummary}
      backHref="/account"
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
    title: "Wallet | ROVEXO",
    robots: { index: false, follow: false },
  };
}
