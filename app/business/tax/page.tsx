import { SellerTaxRegistrationPage } from "@/features/seller/tax/components/SellerTaxRegistrationPage";
import { getBusinessProfile } from "@/lib/profile/data";
import { getSellerTaxProfile } from "@/lib/seller/tax/service";
import { createConnectAccountLink } from "@/lib/stripe/connect";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

/** Business VAT — stays in Business hub (never dumps to My Account). */
export default async function BusinessTaxRoute() {
  const profile = await getBusinessProfile();
  const taxProfile = await getSellerTaxProfile(profile.id);
  const connect = taxProfile?.submittedAt ? await createConnectAccountLink(profile.id) : null;

  return (
    <SellerTaxRegistrationPage
      initialProfile={taxProfile}
      connectUrl={connect && "url" in connect ? connect.url : null}
      backHref="/business/wallet"
      backLabel="Business Wallet"
    />
  );
}
