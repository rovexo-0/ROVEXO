import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Values that look "set" but are not usable secrets.
 * Includes Vercel CLI redaction for Sensitive env vars (`[SENSITIVE]`).
 */
export function isUnusableEnvSecret(value: string | undefined | null): boolean {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return true;
  if (trimmed === "[SENSITIVE]" || trimmed.startsWith("[SEN")) return true;
  if (trimmed === "placeholder" || trimmed === "re_placeholder") return true;
  if (trimmed.includes("your-") || /<[^>]+>/.test(trimmed)) return true;
  return false;
}

function readServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    ""
  );
}

function readAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

function readSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || "";
}

/** True when this process has a real service-role key (Vercel build / real local env). */
export function hasDemoEnvironmentConfig(): boolean {
  const url = readSupabaseUrl();
  const serviceKey = readServiceRoleKey();
  return Boolean(
    url &&
      !isUnusableEnvSecret(url) &&
      !url.includes("placeholder.supabase.co") &&
      serviceKey &&
      !isUnusableEnvSecret(serviceKey),
  );
}

/** True when public Supabase URL + anon key are usable (no service role required). */
export function hasDemoPublicConfig(): boolean {
  const url = readSupabaseUrl();
  const anon = readAnonKey();
  return Boolean(
    url &&
      !isUnusableEnvSecret(url) &&
      !url.includes("placeholder.supabase.co") &&
      anon &&
      !isUnusableEnvSecret(anon),
  );
}

export function assertDemoEnvironmentReady(): void {
  if (hasDemoEnvironmentConfig()) return;

  const onVercel = Boolean(process.env.VERCEL);
  const serviceRaw =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    "";
  const cliRedacted = serviceRaw === "[SENSITIVE]" || serviceRaw.startsWith("[SEN");

  if (onVercel) {
    throw new Error(
      "Vercel build is missing a usable SUPABASE_SERVICE_ROLE_KEY in process.env. " +
        "Configure it in Vercel Project → Settings → Environment Variables (Production).",
    );
  }

  if (cliRedacted) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is marked Sensitive in Vercel. " +
        "Vercel CLI (env pull / env get / env run) redacts it to [SENSITIVE] and cannot inject the real value locally. " +
        "This is NOT evidence that Production is missing the key. " +
        "LIVE admin certification runs with real secrets during Vercel buildCommand (npm run certify:predeploy).",
    );
  }

  throw new Error(
    "Demo environment requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in this process. " +
      "Vercel CLI cannot expose Sensitive production secrets. " +
      "On Vercel builds, secrets are injected automatically into certify:predeploy / certify:full-demo:live.",
  );
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
