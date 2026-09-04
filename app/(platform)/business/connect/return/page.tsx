import { AccountCanonicalShell } from "@/features/account-canonical";
import { BusinessConnectReturn } from "@/features/business/onboarding/BusinessConnectReturn";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Returning from Stripe · ROVEXO",
};

export default async function BusinessConnectReturnPage() {
  await getProfile();

  return (
    <AccountCanonicalShell
      title="CONNECT WITH STRIPE"
      backHref="/business/connect"
      backLabel="Connect"
      showHeaderTitle
    >
      <BusinessConnectReturn />
    </AccountCanonicalShell>
  );
}
