import { getSeoRedirect, invalidateSeoRedirectCache } from "../lib/seo/engine/redirects";
import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseAdminConfigured,
} from "../lib/supabase/env";

async function race<T>(label: string, p: Promise<T>, ms = 8000): Promise<void> {
  const t0 = Date.now();
  const result = await Promise.race([
    p.then((v) => ({ kind: "ok" as const, v, ms: Date.now() - t0 })),
    new Promise<{ kind: "timeout"; ms: number }>((res) =>
      setTimeout(() => res({ kind: "timeout", ms: Date.now() - t0 }), ms),
    ),
  ]);
  console.log(label, result);
}

async function main() {
  console.log("adminConfigured", isSupabaseAdminConfigured());
  invalidateSeoRedirectCache();
  await race("seo", getSeoRedirect("/login"));

  const anon = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  await race("getUser_no_cookie", anon.auth.getUser().then((v) => ({ err: v.error?.message, user: !!v.data.user })));

  const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await race(
    "seo_table",
    admin
      .from("seo_redirects")
      .select("source_path")
      .eq("active", true)
      .limit(5)
      .then((v) => ({ err: v.error?.message, n: v.data?.length })),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
