import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { DeleteAllListingsPanel } from "@/features/super-admin/marketplace/DeleteAllListingsPanel";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Delete All Listings",
};

async function getListingTotal(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("products")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export default async function DeleteAllListingsPage() {
  const total = await getListingTotal();

  return (
    <>
      <SuperAdminPageHeader
        title="Delete All Listings"
        description="Development cleanup — permanently remove every marketplace listing regardless of owner or status. Runs the normal application delete flow with full cascade, then rebuilds Homepage, Search, Categories and Seller Stores."
      />
      <DeleteAllListingsPanel initialTotal={total} />
    </>
  );
}
