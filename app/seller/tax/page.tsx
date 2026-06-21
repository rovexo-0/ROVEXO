import { SellerTaxRegistrationPage } from "@/features/seller/tax/components/SellerTaxRegistrationPage";
import { getProfile } from "@/lib/profile/data";
import { getSellerTaxProfile } from "@/lib/seller/tax/service";
import { createConnectAccountLink } from "@/lib/stripe/connect";
import { redirect } from "next/navigation";

export default async function SellerTaxRoute() {
  const profile = await getProfile();
  if (!profile.isSeller) {
    redirect("/account");
  }

  const taxProfile = await getSellerTaxProfile(profile.id);
  const connect = taxProfile?.submittedAt ? await createConnectAccountLink(profile.id) : null;

  return (
    <SellerTaxRegistrationPage
      initialProfile={taxProfile}
      connectUrl={connect && "url" in connect ? connect.url : null}
    />
  );
}

export async function generateMetadata() {
  return { title: "Seller tax registration | ROVEXO" };
}
