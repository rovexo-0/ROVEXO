import { redirect } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { BusinessInformationForm } from "@/features/business/onboarding/BusinessInformationForm";
import { loadPwaBusinessSession } from "@/lib/business/pwa-business-session";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Business Information · ROVEXO",
};

export default async function BusinessInformationPage() {
  const { status } = await loadPwaBusinessSession();
  if (status.stripe.verified) {
    redirect("/business/dashboard");
  }

  return (
    <AccountCanonicalShell
      title="BUSINESS INFORMATION"
      backHref="/account"
      backLabel="Account"
      showHeaderTitle
    >
      <BusinessInformationForm initial={status.profile} />
    </AccountCanonicalShell>
  );
}
