import { redirect } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { BusinessConnectStripe } from "@/features/business/onboarding/BusinessConnectStripe";
import { loadPwaBusinessSession } from "@/lib/business/pwa-business-session";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Connect with Stripe · ROVEXO",
};

type PageProps = {
  searchParams: Promise<{ stage?: string }>;
};

export default async function BusinessConnectPage({ searchParams }: PageProps) {
  const { status } = await loadPwaBusinessSession();
  if (status.stripe.verified) {
    redirect("/business/dashboard");
  }
  if (!status.hasBusinessProfile) {
    redirect("/business/information");
  }

  const params = await searchParams;
  const stage = params.stage === "onboarding" ? "onboarding" : "intro";

  return (
    <AccountCanonicalShell
      title="CONNECT WITH STRIPE"
      backHref="/business/information"
      backLabel="Business Information"
      showHeaderTitle
    >
      <BusinessConnectStripe stage={stage} stripe={status.stripe} />
    </AccountCanonicalShell>
  );
}
