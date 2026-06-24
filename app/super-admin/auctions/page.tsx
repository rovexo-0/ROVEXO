import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SuperAdminAuctionsPage() {
  const admin = createAdminClient();
  const { count } = await admin
    .from("auction_launch_subscribers")
    .select("*", { count: "exact", head: true });

  return (
    <>
      <SuperAdminPageHeader
        title="Auctions"
        description="Auctions are disabled for v1.0. Monitor launch interest and manage the coming-soon experience."
      />
      <Card padding="md" className="bg-white">
        <p className="text-sm text-text-secondary">Users waiting for Auctions launch</p>
        <p className="mt-ds-1 text-3xl font-bold">{count ?? 0}</p>
        <Link href="/auctions" className="mt-ds-4 inline-flex text-sm font-semibold text-primary">
          View coming soon page
        </Link>
      </Card>
    </>
  );
}
