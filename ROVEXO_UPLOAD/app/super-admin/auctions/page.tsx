import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SuperAdminAuctionsPage() {
  const admin = createAdminClient();

  const [{ count: subscriberCount }, { count: liveAuctionCount }] = await Promise.all([
    admin.from("auction_launch_subscribers").select("*", { count: "exact", head: true }),
    admin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("listing_type", "auction")
      .eq("status", "published"),
  ]);

  return (
    <>
      <SuperAdminPageHeader
        title="Auctions"
        description="Monitor live auction listings and launch-interest subscribers."
      />
      <div className="grid gap-ds-4 md:grid-cols-2">
        <Card padding="md" className="bg-white">
          <p className="text-sm text-text-secondary">Live published auctions</p>
          <p className="mt-ds-1 text-3xl font-bold">{liveAuctionCount ?? 0}</p>
          <Link href="/auctions" className="mt-ds-4 inline-flex text-sm font-semibold text-primary">
            View auctions page
          </Link>
        </Card>
        <Card padding="md" className="bg-white">
          <p className="text-sm text-text-secondary">Launch notification subscribers</p>
          <p className="mt-ds-1 text-3xl font-bold">{subscriberCount ?? 0}</p>
        </Card>
      </div>
    </>
  );
}
