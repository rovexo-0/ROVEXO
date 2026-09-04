import { redirect } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { BusinessHomeScreen } from "@/features/business/onboarding/BusinessHomeScreen";
import {
  activateBusinessContext,
  loadPwaBusinessSession,
  resolveBusinessStoreHref,
} from "@/lib/business/pwa-business-session";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Business Home · ROVEXO",
};

export default async function BusinessDashboardRoute() {
  const { profile, status } = await loadPwaBusinessSession();
  if (!status.stripe.verified) {
    redirect(status.hasBusinessProfile ? "/business/connect" : "/business/information");
  }

  try {
    await activateBusinessContext(profile.id, status.activeSellerContext);
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "STRIPE_VERIFICATION_REQUIRED" || name === "BUSINESS_INFORMATION_REQUIRED") {
      redirect(status.hasBusinessProfile ? "/business/connect" : "/business/information");
    }
    // Do not abort Business Home after a successful client switch. A thrown RSC
    // cancels App Router navigation and leaves the user on /account.
  }
  const storeHref = resolveBusinessStoreHref(profile);

  return (
    <AccountCanonicalShell
      title="BUSINESS HOME"
      backHref="/"
      backLabel="Home"
      showHeaderTitle
    >
      <BusinessHomeScreen status={status} storeHref={storeHref} />
    </AccountCanonicalShell>
  );
}
