import { redirect } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { BusinessMenuScreen } from "@/features/business/onboarding/BusinessMenuScreen";
import {
  loadPwaBusinessSession,
  resolveBusinessStoreHref,
} from "@/lib/business/pwa-business-session";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Business Menu · ROVEXO",
};

export default async function BusinessMenuPage() {
  const { profile, status } = await loadPwaBusinessSession();
  if (!status.stripe.verified) {
    redirect(status.hasBusinessProfile ? "/business/connect" : "/business/information");
  }

  const walletLabel =
    status.wallet == null
      ? null
      : new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP",
          minimumFractionDigits: 2,
        }).format(status.wallet.availableBalance + status.wallet.pendingBalance);

  return (
    <AccountCanonicalShell
      title="BUSINESS MENU"
      backHref="/business/dashboard"
      backLabel="Business Home"
      showHeaderTitle
    >
      <BusinessMenuScreen
        storeHref={resolveBusinessStoreHref(profile)}
        walletLabel={walletLabel}
      />
    </AccountCanonicalShell>
  );
}
