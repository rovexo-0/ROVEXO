import { AccountCanonicalShell } from "@/features/account-canonical";
import { SellerSetupChecklist } from "@/features/seller/components/SellerSetupChecklist";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Seller setup · ROVEXO",
  description: "One-time payouts, shipping and store setup.",
};

export default async function SellerSetupPage({
  searchParams,
}: {
  searchParams?: Promise<{ context?: string }> | { context?: string };
}) {
  await getProfile();
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const sellerContext = params?.context === "business" ? "business" : "individual";

  return (
    <AccountCanonicalShell
      title="Seller setup"
      backHref="/seller"
      backLabel="Selling"
      showHeaderTitle
      showBottomNav={false}
      intro="Complete seller setup once. Stripe, shipping and store stay connected."
    >
      <SellerSetupChecklist sellerContext={sellerContext} />
    </AccountCanonicalShell>
  );
}
