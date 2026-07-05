import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseUrl } from "@/lib/supabase/env";

export function hasDemoEnvironmentConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim() || "";
  return Boolean(url && serviceKey && !url.includes("placeholder.supabase.co"));
}

export function assertDemoEnvironmentReady(): void {
  if (!hasDemoEnvironmentConfig()) {
    throw new Error(
      "Demo environment requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (non-placeholder).",
    );
  }
}

export function getDemoAdminClient() {
  assertDemoEnvironmentReady();
  return createAdminClient();
}

/** Quick connectivity check before seeding (auth admin + DB). */
export async function assertDemoEnvironmentReachable(): Promise<void> {
  assertDemoEnvironmentReady();
  const admin = createAdminClient();
  const timeoutMs = 15_000;

  const dbResult = await Promise.race([
    admin.from("profiles").select("id", { head: true, count: "exact" }).limit(1),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Supabase database timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    }),
  ]);

  if (dbResult.error) {
    throw new Error(
      `Supabase database unreachable (${getSupabaseUrl()}): ${dbResult.error.message}`,
    );
  }

  const authResult = await Promise.race([
    admin.auth.admin.listUsers({ page: 1, perPage: 1 }),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Supabase Auth admin timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    }),
  ]);

  if (authResult.error) {
    throw new Error(
      [
        `Supabase Auth admin API failed (${getSupabaseUrl()}): ${authResult.error.message || JSON.stringify(authResult.error)}`,
        "Verify SUPABASE_SERVICE_ROLE_KEY is the service role secret (not the anon/publishable key).",
        "If createUser returns HTTP 500, apply pending migrations: npm run db:push",
      ].join(" "),
    );
  }
}
