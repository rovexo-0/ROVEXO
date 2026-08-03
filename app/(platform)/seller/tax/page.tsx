import { SellerTaxRegistrationPage } from "@/features/seller/tax/components/SellerTaxRegistrationPage";
import { getProfile } from "@/lib/profile/data";
import { getProfileDetails } from "@/lib/profile/service";
import { getSellerTaxProfile } from "@/lib/seller/tax/service";
import { createConnectAccountLink } from "@/lib/stripe/connect";
import { redirect } from "next/navigation";

export default async function SellerTaxRoute() {
  const profile = await getProfile();
  // Never dump Business/Selling tools to My Account (Final Master Order).
  if (!profile.isSeller) {
    redirect("/seller");
  }

  const [taxProfile, details] = await Promise.all([
    getSellerTaxProfile(profile.id),
    getProfileDetails(profile.id),
  ]);
  const connect = taxProfile?.submittedAt ? await createConnectAccountLink(profile.id) : null;

  return (
    <SellerTaxRegistrationPage
      initialProfile={taxProfile}
      initialDateOfBirth={details?.dateOfBirth ?? null}
      connectUrl={connect && "url" in connect ? connect.url : null}
    />
  );
}

export async function generateMetadata() {
  return { title: "Seller tax registration | ROVEXO" };
}
