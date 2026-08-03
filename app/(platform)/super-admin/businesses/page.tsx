import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SuperAdminBusinessesPage() {
  const admin = createAdminClient();
  const { count } = await admin.from("business_accounts").select("*", { count: "exact", head: true });
  const { data: businesses } = await admin
    .from("business_accounts")
    .select("id, business_name, tax_id, verified_business, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <SuperAdminPageHeader
        title="Business Management"
        description="Manage company verification, business accounts, subscriptions, and limits."
      />
      <Card padding="md" className="mb-ds-4 bg-white">
        <p className="text-sm text-text-secondary">Total business accounts</p>
        <p className="text-3xl font-bold">{count ?? 0}</p>
      </Card>
      <div className="space-y-ds-3">
        {(businesses ?? []).map((business) => (
          <Card key={business.id} padding="md" className="bg-white">
            <div className="flex flex-wrap items-center justify-between gap-ds-2">
              <div>
                <p className="font-semibold">{business.business_name}</p>
                <p className="text-sm text-text-secondary">
                  {business.verified_business ? "Verified business" : "Pending verification"}
                  {business.tax_id ? ` · ${business.tax_id}` : ""}
                </p>
              </div>
              <Link href={`/super-admin/users?q=${business.id}`} className="text-sm font-medium text-primary">
                Manage user
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
