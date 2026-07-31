/**
 * Phase D — QA / demo commerce data reset.
 *
 * KEEP: users · auth · passwords · sessions · settings · verification · preferences · legal acceptance
 *        · Full Demo accounts (demo.buyer@ / demo.seller@)
 * REMOVE: QA/demo titled listings · demo session artifacts · orphaned test commerce rows linked to purged listings
 *
 * NEVER deletes real user accounts.
 * NEVER runs against known production Supabase host without PHASE_D_RESET_ALLOW_PRODUCTION_HOST=1.
 *
 *   npm run phase-d:qa-reset -- --dry
 *   npm run phase-d:qa-reset -- --yes
 */
import { loadDotEnvFiles } from "./playwright-env.mjs";
import { createAdminClient } from "../lib/supabase/admin";
import { tryGetSupabaseUrl } from "../lib/supabase/env";

loadDotEnvFiles();

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry") || args.has("--dry-run") || !args.has("--yes");
const ALLOW_PROD = process.env.PHASE_D_RESET_ALLOW_PRODUCTION_HOST === "1";

const PRODUCTION_SUPABASE_HOSTS = ["pklotmwxtnnepaitedic.supabase.co"];

const FULL_DEMO_EMAILS = new Set(["demo.buyer@rovexo.co.uk", "demo.seller@rovexo.co.uk"]);

const TEST_PRODUCT_PATTERNS = [
  /runtime\s*test/i,
  /\btest\b/i,
  /\bdemo\b/i,
  /placeholder/i,
  /\bqa\b/i,
  /\bseed\b/i,
  /mulisoft/i,
];

function normalizeHost(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function isFullDemoProtectedSlug(slug: string | null | undefined): boolean {
  return /^demo-live-(?:buyer|seller)-\d{3}$/.test(String(slug ?? ""));
}

function isQaProduct(title: string | null | undefined, slug: string | null | undefined): boolean {
  if (isFullDemoProtectedSlug(slug)) return false;
  const hay = `${title ?? ""} ${slug ?? ""}`;
  return TEST_PRODUCT_PATTERNS.some((pattern) => pattern.test(hay));
}

async function main() {
  const targetUrl = tryGetSupabaseUrl();
  const host = targetUrl ? normalizeHost(targetUrl) : null;

  if (!targetUrl) {
    console.error(JSON.stringify({ ok: false, error: "SUPABASE_URL not configured" }, null, 2));
    process.exit(1);
  }

  if (host && PRODUCTION_SUPABASE_HOSTS.includes(host) && !ALLOW_PROD && !DRY_RUN) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error:
            "Refusing to APPLY purge on production Supabase host. Dry-run is allowed. Set PHASE_D_RESET_ALLOW_PRODUCTION_HOST=1 with --yes only after Owner approval.",
          host,
          dryRun: DRY_RUN,
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  if (host && PRODUCTION_SUPABASE_HOSTS.includes(host) && DRY_RUN) {
    console.warn(
      JSON.stringify({
        warning: "Target is production Supabase host — dry-run only (no deletes).",
        host,
      }),
    );
  }

  const admin = createAdminClient();

  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, title, slug, status, seller_id");

  if (productsError) {
    console.error(JSON.stringify({ ok: false, error: productsError.message }, null, 2));
    process.exit(1);
  }

  const targets = (products ?? []).filter((p) => isQaProduct(p.title, p.slug));
  const keptFullDemo = (products ?? []).filter((p) => isFullDemoProtectedSlug(p.slug));

  const purged: Array<{
    id: string;
    title: string | null;
    slug: string | null;
    status: string;
  }> = [];

  for (const product of targets) {
    if (DRY_RUN) {
      purged.push({
        id: product.id,
        title: product.title,
        slug: product.slug,
        status: "would_purge",
      });
      continue;
    }

    await admin.from("product_images").delete().eq("product_id", product.id);
    await admin.from("saved_items").delete().eq("product_id", product.id);
    try {
      await admin.from("offers").delete().eq("product_id", product.id);
    } catch {
      /* offers may cascade or use different FK */
    }
    const { error } = await admin.from("products").delete().eq("id", product.id);
    purged.push({
      id: product.id,
      title: product.title,
      slug: product.slug,
      status: error ? `error:${error.message}` : "purged",
    });
  }

  // Demo session artifacts (if table exists) — never touch auth users.
  let demoSessions: { scanned: boolean; deleted: number | string } = {
    scanned: false,
    deleted: 0,
  };
  try {
    const { data: sessions } = await admin.from("demo_sessions").select("id").limit(500);
    demoSessions.scanned = true;
    if (!DRY_RUN && sessions?.length) {
      for (const session of sessions) {
        await admin.from("demo_sessions").delete().eq("id", session.id);
      }
      demoSessions.deleted = sessions.length;
    } else {
      demoSessions.deleted = DRY_RUN ? `would_delete:${sessions?.length ?? 0}` : 0;
    }
  } catch {
    demoSessions = { scanned: false, deleted: "table_unavailable" };
  }

  // Assert Full Demo accounts still exist (never deleted by this script).
  const { data: demoProfiles } = await admin
    .from("profiles")
    .select("email")
    .in("email", [...FULL_DEMO_EMAILS]);

  const report = {
    ok: true,
    phase: "D",
    dryRun: DRY_RUN,
    host,
    keptUsersPolicy: "ALL_USERS_KEPT",
    fullDemoAccountsPresent: (demoProfiles ?? []).map((p) => p.email),
    fullDemoProtectedListingsKept: keptFullDemo.length,
    qaListingsTargeted: targets.length,
    purged,
    demoSessions,
    note: DRY_RUN
      ? "Dry run only. Re-run with --yes to apply. Users are never deleted."
      : "QA listings purged. Users / auth / settings preserved.",
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
