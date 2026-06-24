import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SuperAdminListingsPage() {
  const admin = createAdminClient();
  const { data: listings } = await admin
    .from("products")
    .select("id, title, slug, status, price, seller_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <SuperAdminPageHeader title="Listings" description="Review and manage marketplace listings." />
      <div className="space-y-ds-3">
        {(listings ?? []).map((listing) => (
          <Card key={listing.id} padding="md" className="bg-white">
            <div className="flex flex-wrap items-center justify-between gap-ds-2">
              <div>
                <p className="font-semibold">{listing.title}</p>
                <p className="text-sm text-text-secondary">
                  {listing.status} · £{Number(listing.price).toFixed(2)}
                </p>
              </div>
              <Link href={`/listing/${listing.slug}`} className="text-sm font-medium text-primary">
                View listing
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
