import { WalletPage } from "@/features/wallet/components/WalletPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { syncConnectAccountBySellerId } from "@/lib/stripe/connect";
import { redirect } from "next/navigation";

type WalletRouteProps = {
  searchParams: Promise<{ connect?: string }>;
};

/** Personal Wallet — one of two allowed wallets (PO). Available to all signed-in users. */
export default async function WalletRoute({ searchParams }: WalletRouteProps) {
  const profile = await fetchProfile();

  if (!profile) {
    redirect("/login?next=/wallet");
  }

  const params = await searchParams;
  if (profile.isSeller && (params.connect === "success" || params.connect === "refresh")) {
    await syncConnectAccountBySellerId(profile.id);
  }

  const data = await fetchWalletData();

  return (
    <WalletPage
      data={data}
      backHref="/account"
      variant="personal"
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
    title: "Personal Wallet | ROVEXO",
    robots: { index: false, follow: false },
  };
}
