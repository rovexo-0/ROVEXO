import { redirect } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { BusinessActiveScreen } from "@/features/business/onboarding/BusinessActiveScreen";
import { loadPwaBusinessSession } from "@/lib/business/pwa-business-session";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Business Active · ROVEXO",
};

export default async function BusinessActivePage() {
  const { status } = await loadPwaBusinessSession();
  if (!status.stripe.verified) {
    redirect(status.hasBusinessProfile ? "/business/connect" : "/business/information");
  }

  return (
    <AccountCanonicalShell
      title="BUSINESS ACTIVE"
      backHref="/business/dashboard"
      backLabel="Business Home"
      showHeaderTitle
    >
      <BusinessActiveScreen />
    </AccountCanonicalShell>
  );
}
