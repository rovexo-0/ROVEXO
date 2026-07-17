import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import { DEMO_USERS, resolveDemoUserPassword } from "@/lib/demo-environment/config";
import { getDemoAdminClient, hasDemoEnvironmentConfig } from "@/lib/demo-environment/guards";

export type DemoEnvironmentVerificationReport = {
  ok: boolean;
  generatedAt: string;
  checks: Array<{ id: string; label: string; pass: boolean; note?: string }>;
  score: number;
};

async function verifyLogin(email: string, password: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return false;

  const client = createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) return false;
  await client.auth.signOut();
  return true;
}

export async function runDemoEnvironmentVerification(): Promise<DemoEnvironmentVerificationReport> {
  if (!hasDemoEnvironmentConfig()) {
    return {
      ok: false,
      generatedAt: new Date().toISOString(),
      checks: [
        {
          id: "supabase-config",
          label: "Supabase configured",
          pass: false,
          note: "Missing NEXT_PUBLIC_SUPABASE_URL or service role key",
        },
      ],
      score: 0,
    };
  }

  const admin = getDemoAdminClient();
  const checks: DemoEnvironmentVerificationReport["checks"] = [];

  for (const user of DEMO_USERS) {
    const password = resolveDemoUserPassword(user);
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role, verified, account_status")
      .eq("email", user.email)
      .maybeSingle();

    checks.push({
      id: `profile-${user.key}`,
      label: `${user.email} profile exists`,
      pass: Boolean(profile?.id),
    });

    checks.push({
      id: `verified-${user.key}`,
      label: `${user.email} verified and active`,
      pass: profile?.verified === true && profile?.account_status === "active",
    });

    checks.push({
      id: `role-${user.key}`,
      label: `${user.email} role = ${user.role}`,
      pass: profile?.role === user.role,
    });

    checks.push({
      id: `login-${user.key}`,
      label: `${user.email} login works`,
      pass: await verifyLogin(user.email, password),
    });
  }

  const { count: listingCount } = await admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .like("slug", "demo-%")
    .eq("status", "published");

  checks.push({
    id: "listings",
    label: "300+ demo listings published",
    pass: (listingCount ?? 0) >= 300,
    note: `${listingCount ?? 0} listings`,
  });

  const { count: orderCount } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .like("order_number", "DEMO-%");

  checks.push({
    id: "orders",
    label: "Demo orders seeded",
    pass: (orderCount ?? 0) >= 8,
    note: `${orderCount ?? 0} orders`,
  });

  const { count: messageCount } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true });

  checks.push({
    id: "messages",
    label: "Demo messages exist",
    pass: (messageCount ?? 0) >= 16,
    note: `${messageCount ?? 0} messages`,
  });

  const passed = checks.filter((check) => check.pass).length;
  const score = checks.length === 0 ? 0 : Math.round((passed / checks.length) * 100);

  return {
    ok: score >= 95,
    generatedAt: new Date().toISOString(),
    checks,
    score,
  };
}
