import { Card } from "@/components/ui/Card";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminBusinessPage() {
  const admin = createAdminClient();
  const { count: businessAccounts } = await admin
    .from("business_accounts")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-ds-6">
      <h2 className="text-xl font-semibold">Business Ecosystem</h2>
      <div className="grid gap-ds-4 sm:grid-cols-2">
        <Card padding="lg" className="shadow-ds-soft">
          <p className="text-sm text-text-secondary">Business accounts</p>
          <p className="mt-ds-1 text-2xl font-bold">{businessAccounts ?? 0}</p>
        </Card>
      </div>
    </div>
  );
}
