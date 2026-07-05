import { QuickListingPanel } from "@/features/super-admin/mission-control/QuickListingPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SuperAdminQuickListingPage() {
  const admin = createAdminClient();
  const { data: listings } = await admin
    .from("products")
    .select("id, title, slug, status, price, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  const initialListings = (listings ?? []).map((listing) => ({
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    status: listing.status,
    price: Number(listing.price),
    createdAt: listing.created_at,
  }));

  return (
    <>
      <SuperAdminPageHeader
        title="Quick Listing"
        description="Create, publish, feature, and archive listings directly from Mission Control."
      />
      <QuickListingPanel initialListings={initialListings} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Quick Listing | Mission Control | ROVEXO",
    robots: { index: false, follow: false },
  };
}
