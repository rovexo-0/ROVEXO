import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SuperAdminWalletPage() {
  const admin = createAdminClient();
  const [{ count: pendingWithdrawals }, { data: transactions }] = await Promise.all([
    admin
      .from("wallet_transactions")
      .select("*", { count: "exact", head: true })
      .eq("type", "withdrawal")
      .eq("status", "pending"),
    admin
      .from("wallet_transactions")
      .select("id, user_id, amount, type, status, description, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <>
      <SuperAdminPageHeader title="Wallet" description="Seller balances, withdrawals, and manual adjustments." />
      <Card padding="md" className="mb-ds-4 bg-white">
        <p className="text-sm text-text-secondary">Pending withdrawals</p>
        <p className="text-3xl font-bold">{pendingWithdrawals ?? 0}</p>
      </Card>
      <div className="space-y-ds-3">
        {(transactions ?? []).map((tx) => (
          <Card key={tx.id} padding="md" className="bg-white">
            <p className="font-semibold">{tx.description ?? tx.type}</p>
            <p className="text-sm text-text-secondary">
              £{Number(tx.amount).toFixed(2)} · {tx.status}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
