import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SuperAdminVisitorsPage() {
  const admin = createAdminClient();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
  const [{ count: onlineNow }, { data: presence }] = await Promise.all([
    admin
      .from("user_presence")
      .select("*", { count: "exact", head: true })
      .eq("online", true)
      .gte("updated_at", fiveMinutesAgo),
    admin
      .from("user_presence")
      .select("user_id, online, last_seen_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <>
      <SuperAdminPageHeader title="Live Visitors" description="Users currently active on the platform." />
      <Card padding="md" className="mb-ds-4 bg-white">
        <p className="text-sm text-text-secondary">Online now (5 min window)</p>
        <p className="text-3xl font-bold">{onlineNow ?? 0}</p>
      </Card>
      <div className="space-y-ds-2">
        {(presence ?? []).map((row) => (
          <Card key={row.user_id} padding="md" className="bg-white">
            <p className="font-semibold">{row.user_id}</p>
            <p className="text-sm text-text-secondary">
              {row.online ? "Online" : "Offline"} · Last seen {new Date(row.last_seen_at).toLocaleString("en-GB")}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
