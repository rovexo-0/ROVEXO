import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AddressesPage } from "@/features/account/components/addresses";
import { fetchProfile } from "@/lib/profile/queries";
import { isBusinessVerifiedAccount } from "@/lib/verified/evaluate";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Addresses",
};

async function loadBusinessProfile(userId: string, isBusinessVerified: boolean) {
  if (!isBusinessVerified) return null;
  const admin = tryCreateAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("business_accounts")
    .select("business_name, tax_id")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    businessName: data.business_name ? String(data.business_name) : null,
    companyNumber: data.tax_id ? String(data.tax_id) : null,
    vatRegistered: Boolean(data.tax_id),
  };
}

export default async function AccountAddressesRoute() {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/account/addresses");
  }

  const isBusinessVerified = await isBusinessVerifiedAccount(profile.id).catch(() => false);
  const businessProfile = await loadBusinessProfile(profile.id, isBusinessVerified);

  return (
    <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading addresses…</div>}>
      <AddressesPage
        isBusinessVerified={isBusinessVerified}
        businessProfile={businessProfile}
      />
    </Suspense>
  );
}
