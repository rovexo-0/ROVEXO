/**
 * ROVEXO Production Launch Reset v1.0 — ZERO operational marketplace data.
 *
 * Default: DRY-RUN (counts only). Never mutates schema/migrations/config.
 *
 * Apply (Owner only):
 *   LAUNCH_RESET_OWNER_APPROVED=1 \
 *   LAUNCH_RESET_ALLOW_PRODUCTION_HOST=1 \
 *   npm run launch:reset -- --yes
 *
 * Full Demo accounts (demo.buyer@ / demo.seller@) are NEVER deleted.
 * Wallet shells kept; wallet_transactions wiped; Full Demo floors restored on apply.
 */
import { loadDotEnvFiles } from "./playwright-env.mjs";
import { createAdminClient } from "../lib/supabase/admin";
import { tryGetSupabaseUrl } from "../lib/supabase/env";
import { PRODUCTION_LAUNCH_RESET_V1 } from "../lib/launch/production-launch-reset-v1";

loadDotEnvFiles();

type Admin = ReturnType<typeof createAdminClient>;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry") || args.has("--dry-run") || !args.has("--yes");
const OWNER_APPROVED = process.env.LAUNCH_RESET_OWNER_APPROVED === "1";
const ALLOW_PROD = process.env.LAUNCH_RESET_ALLOW_PRODUCTION_HOST === "1";
const PRODUCTION_SUPABASE_HOSTS = ["pklotmwxtnnepaitedic.supabase.co"];

function normalizeHost(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

type CountResult = number | { status: "missing" | "error"; message: string };

async function countRows(admin: Admin, table: string): Promise<CountResult> {
  const { count, error } = await admin
    .from(table as "products")
    .select("*", { count: "exact", head: true });
  if (error) {
    const message = error.message;
    const lower = message.toLowerCase();
    if (
      lower.includes("does not exist") ||
      lower.includes("could not find") ||
      lower.includes("schema cache") ||
      lower.includes("relation") && lower.includes("does not exist")
    ) {
      return { status: "missing", message };
    }
    return { status: "error", message };
  }
  return count ?? 0;
}

function countValue(result: CountResult): number | "missing" | "error" {
  if (typeof result === "number") return result;
  return result.status;
}

function countMessage(result: CountResult): string | undefined {
  if (typeof result === "number") return undefined;
  return result.message;
}

async function deleteAllRows(
  admin: Admin,
  table: string,
): Promise<{ ok: boolean; removed: number | null; error?: string }> {
  const beforeResult = await countRows(admin, table);
  const before = countValue(beforeResult);
  if (before === "missing") return { ok: true, removed: 0, error: "missing_table" };
  if (before === "error") {
    return { ok: false, removed: null, error: countMessage(beforeResult) ?? "count_failed" };
  }

  // Prefer id IS NOT NULL; fall back to common FK columns for composite tables.
  const attempts: Array<{ column: string }> = [
    { column: "id" },
    { column: "created_at" },
    { column: "user_id" },
    { column: "product_id" },
    { column: "order_id" },
  ];

  let lastError = "";
  for (const attempt of attempts) {
    const { error } = await admin
      .from(table as "products")
      .delete()
      .not(attempt.column, "is", null);
    if (!error) {
      const afterResult = await countRows(admin, table);
      const remaining = countValue(afterResult);
      if (typeof remaining !== "number") {
        return { ok: false, removed: null, error: countMessage(afterResult) ?? "recount_failed" };
      }
      return {
        ok: remaining === 0,
        removed: before - remaining,
        error: remaining === 0 ? undefined : `rows_remaining:${remaining}`,
      };
    }
    lastError = error.message;
    if (
      lastError.toLowerCase().includes("column") &&
      lastError.toLowerCase().includes("does not exist")
    ) {
      continue;
    }
    // Append-only / trigger protection — report and continue.
    break;
  }

  return { ok: false, removed: 0, error: lastError || "delete_failed" };
}

async function restoreFullDemoWalletFloors(admin: Admin): Promise<string[]> {
  const notes: string[] = [];
  const floor = PRODUCTION_LAUNCH_RESET_V1.fullDemoWalletFloorGbp;
  for (const email of PRODUCTION_LAUNCH_RESET_V1.fullDemoEmails) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();
    if (!profile?.id) {
      notes.push(`${email}: profile_missing`);
      continue;
    }
    const { error } = await admin.from("wallets").upsert(
      {
        user_id: profile.id,
        available_balance: floor,
        pending_balance: 0,
        locked_balance: 0,
      } as never,
      { onConflict: "user_id" },
    );
    notes.push(error ? `${email}: wallet_error:${error.message}` : `${email}: wallet_floor_${floor}`);
  }
  return notes;
}

async function resetSellerCounters(admin: Admin): Promise<void> {
  // follower_count was removed from seller_profiles (social removal); do not set it.
  await admin
    .from("seller_profiles" as "profiles")
    .update({
      rating: 0,
      review_count: 0,
      listing_count: 0,
      sales_count: 0,
    } as never)
    .not("id", "is", null);
}

async function resetProfileFollowCounters(admin: Admin): Promise<void> {
  await admin
    .from("profiles")
    .update({
      follower_count: 0,
      following_count: 0,
    } as never)
    .not("id", "is", null);
}

async function zeroNonDemoWallets(admin: Admin): Promise<string> {
  const { data: demoProfiles } = await admin
    .from("profiles")
    .select("id")
    .in("email", [...PRODUCTION_LAUNCH_RESET_V1.fullDemoEmails]);
  const demoIds = new Set((demoProfiles ?? []).map((row) => row.id));

  const { data: wallets } = await admin.from("wallets").select("user_id");
  let zeroed = 0;
  for (const wallet of wallets ?? []) {
    if (demoIds.has(wallet.user_id)) continue;
    const { error } = await admin
      .from("wallets")
      .update({
        available_balance: 0,
        pending_balance: 0,
        locked_balance: 0,
      } as never)
      .eq("user_id", wallet.user_id);
    if (!error) zeroed += 1;
  }
  return `non_demo_wallets_zeroed:${zeroed}`;
}

async function purgeProductStorage(admin: Admin): Promise<number> {
  let removed = 0;
  const { data: sellers, error } = await admin.storage.from("products").list("", { limit: 1000 });
  if (error || !sellers) return removed;
  for (const seller of sellers) {
    const { data: products } = await admin.storage.from("products").list(seller.name, {
      limit: 1000,
    });
    for (const product of products ?? []) {
      const prefix = `${seller.name}/${product.name}`;
      const { data: files } = await admin.storage.from("products").list(prefix, { limit: 1000 });
      const paths = (files ?? []).map((file) => `${prefix}/${file.name}`);
      if (paths.length) {
        await admin.storage.from("products").remove(paths);
        removed += paths.length;
      }
    }
  }
  return removed;
}

function keepEmailSet(): Set<string> {
  return new Set(
    [
      ...PRODUCTION_LAUNCH_RESET_V1.keepOwnerEmails,
      ...PRODUCTION_LAUNCH_RESET_V1.fullDemoEmails,
    ].map((email) => email.toLowerCase()),
  );
}

async function listProfilesForPurge(admin: Admin): Promise<
  Array<{ id: string; email: string | null; role: string | null; keep: boolean }>
> {
  const keep = keepEmailSet();
  const { data } = await admin.from("profiles").select("id, email, role");
  return (data ?? []).map((row) => {
    const email = String(row.email ?? "")
      .trim()
      .toLowerCase();
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      keep: Boolean(email && keep.has(email)),
    };
  });
}

async function ensureKeepOwnerRoles(admin: Admin): Promise<string[]> {
  const notes: string[] = [];
  for (const [email, role] of Object.entries(PRODUCTION_LAUNCH_RESET_V1.keepOwnerRoles)) {
    const { data, error } = await admin
      .from("profiles")
      .update({ role } as never)
      .eq("email", email)
      .select("id, email, role")
      .maybeSingle();
    if (error) notes.push(`${email}: role_error:${error.message}`);
    else if (!data) notes.push(`${email}: profile_missing`);
    else notes.push(`${email}: role=${data.role}`);
  }
  return notes;
}

async function purgeNonKeepUsers(admin: Admin): Promise<{
  purged: Array<{ id: string; email: string | null }>;
  failed: Array<{ id: string; email: string | null; error: string }>;
  kept: Array<{ id: string; email: string | null; role: string | null }>;
}> {
  const profiles = await listProfilesForPurge(admin);
  const kept = profiles
    .filter((row) => row.keep)
    .map((row) => ({ id: row.id, email: row.email, role: row.role }));
  const targets = profiles.filter((row) => !row.keep);
  const purged: Array<{ id: string; email: string | null }> = [];
  const failed: Array<{ id: string; email: string | null; error: string }> = [];

  for (const target of targets) {
    // Cascade: products already wiped; remove remaining seller-owned rows then auth user.
    await admin.from("products").delete().eq("seller_id", target.id);
    await admin.from("wallets").delete().eq("user_id", target.id);
    await admin.from("user_settings").delete().eq("user_id", target.id);
    await admin.from("seller_profiles").delete().eq("id", target.id);
    await admin.from("profiles").delete().eq("id", target.id);
    const { error } = await admin.auth.admin.deleteUser(target.id);
    if (error) {
      failed.push({ id: target.id, email: target.email, error: error.message });
    } else {
      purged.push({ id: target.id, email: target.email });
    }
  }

  return { purged, failed, kept };
}

async function main(): Promise<void> {
  const targetUrl = tryGetSupabaseUrl();
  const host = targetUrl ? normalizeHost(targetUrl) : null;

  if (!targetUrl) {
    console.error(JSON.stringify({ ok: false, error: "SUPABASE_URL not configured" }, null, 2));
    process.exit(1);
  }

  const isProductionHost = Boolean(host && PRODUCTION_SUPABASE_HOSTS.includes(host));

  if (!DRY_RUN) {
    if (!OWNER_APPROVED) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            error:
              "APPLY blocked. Set LAUNCH_RESET_OWNER_APPROVED=1 with --yes only after Owner approval.",
            dryRun: false,
          },
          null,
          2,
        ),
      );
      process.exit(2);
    }
    if (isProductionHost && !ALLOW_PROD) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            error:
              "APPLY blocked on production Supabase host. Set LAUNCH_RESET_ALLOW_PRODUCTION_HOST=1 with Owner approval.",
            host,
          },
          null,
          2,
        ),
      );
      process.exit(2);
    }
  }

  if (isProductionHost && DRY_RUN) {
    console.warn(
      JSON.stringify({
        warning: "Target is production Supabase host — dry-run only (no deletes).",
        host,
      }),
    );
  }

  const admin = createAdminClient();
  const before: Record<string, number | "missing" | "error"> = {};
  const countErrors: Record<string, string> = {};
  const removed: Record<
    string,
    { before: number | "missing" | "error"; removed: number | null; status: string }
  > = {};

  for (const table of PRODUCTION_LAUNCH_RESET_V1.deleteTablesInOrder) {
    const result = await countRows(admin, table);
    before[table] = countValue(result);
    const message = countMessage(result);
    if (message) countErrors[table] = message;
  }

  if (DRY_RUN) {
    const verification: Record<string, number | "missing" | "error"> = {};
    for (const table of PRODUCTION_LAUNCH_RESET_V1.verificationZeroTables) {
      verification[table] = before[table];
    }
    const protectedRemaining: Record<string, number | "missing" | "error"> = {};
    for (const table of PRODUCTION_LAUNCH_RESET_V1.protectedCountTables) {
      const result = await countRows(admin, table);
      protectedRemaining[table] = countValue(result);
      const message = countMessage(result);
      if (message) countErrors[table] = message;
    }

    const nonZeroOperational = Object.entries(verification).filter(
      ([, count]) => typeof count === "number" && count > 0,
    );
    const sampleErrors = Object.fromEntries(Object.entries(countErrors).slice(0, 8));

    const profiles = await listProfilesForPurge(admin);
    const wouldPurgeUsers = profiles.filter((row) => !row.keep);
    const wouldKeepUsers = profiles.filter((row) => row.keep);

    console.log(
      JSON.stringify(
        {
          ok: Object.keys(countErrors).length === 0,
          mode: "DRY_RUN",
          host,
          passFail: "WAITING_FOR_OWNER_APPROVAL",
          message:
            "No data deleted. APPLY requires Owner approval + LAUNCH_RESET_OWNER_APPROVED=1 + LAUNCH_RESET_ALLOW_PRODUCTION_HOST=1 + --yes.",
          tablesWouldClean: PRODUCTION_LAUNCH_RESET_V1.deleteTablesInOrder,
          recordsWouldRemovePerTable: before,
          usersWouldPurge: wouldPurgeUsers.map((row) => ({
            id: row.id,
            email: row.email,
            role: row.role,
          })),
          usersWouldKeep: wouldKeepUsers.map((row) => ({
            id: row.id,
            email: row.email,
            role: row.role,
          })),
          keepOwnerEmails: PRODUCTION_LAUNCH_RESET_V1.keepOwnerEmails,
          fullDemoEmailsRetainedByLaw: PRODUCTION_LAUNCH_RESET_V1.fullDemoEmails,
          countErrorsSample: sampleErrors,
          countErrorTotal: Object.keys(countErrors).length,
          storageCleaned: { productsBucketObjectsRemoved: 0, note: "dry_run_skipped" },
          integrity: {
            schemaUnchanged: true,
            migrationsUnchanged: true,
            brokenForeignKeys: "n/a_until_apply",
          },
          remainingProtectedData: protectedRemaining,
          verificationCounts: verification,
          nonZeroOperationalBeforeReset: Object.fromEntries(nonZeroOperational),
          keep: PRODUCTION_LAUNCH_RESET_V1.keep,
          forbidden: PRODUCTION_LAUNCH_RESET_V1.forbidden,
        },
        null,
        2,
      ),
    );
    return;
  }

  // APPLY
  for (const table of PRODUCTION_LAUNCH_RESET_V1.deleteTablesInOrder) {
    const result = await deleteAllRows(admin, table);
    removed[table] = {
      before: before[table],
      removed: result.removed,
      status: result.error ?? (result.ok ? "purged" : "failed"),
    };
  }

  await resetSellerCounters(admin);
  await resetProfileFollowCounters(admin);
  const walletZeroNote = await zeroNonDemoWallets(admin);
  const walletNotes = await restoreFullDemoWalletFloors(admin);
  const storageRemoved = await purgeProductStorage(admin);
  const userPurge = PRODUCTION_LAUNCH_RESET_V1.purgeNonKeepUsers
    ? await purgeNonKeepUsers(admin)
    : { purged: [], failed: [], kept: [] };
  const roleNotes = await ensureKeepOwnerRoles(admin);

  const verificationAfter: Record<string, number | "missing" | "error"> = {};
  let zeroPass = true;
  for (const table of PRODUCTION_LAUNCH_RESET_V1.verificationZeroTables) {
    const result = await countRows(admin, table);
    const count = countValue(result);
    verificationAfter[table] = count;
    if (typeof count === "number" && count !== 0) zeroPass = false;
    if (count === "error") zeroPass = false;
  }

  const protectedRemaining: Record<string, number | "missing" | "error"> = {};
  for (const table of PRODUCTION_LAUNCH_RESET_V1.protectedCountTables) {
    protectedRemaining[table] = countValue(await countRows(admin, table));
  }

  const failedDeletes = Object.entries(removed)
    .filter(([, row]) => row.status !== "purged" && row.status !== "missing_table")
    .map(([table, row]) => ({ table, status: row.status }));

  const usersPass = userPurge.failed.length === 0;
  const pass = zeroPass && failedDeletes.length === 0 && usersPass;

  console.log(
    JSON.stringify(
      {
        ok: pass,
        mode: "APPLY",
        host,
        tablesCleaned: Object.keys(removed),
        recordsRemovedPerTable: removed,
        usersPurged: userPurge.purged,
        usersPurgeFailed: userPurge.failed,
        usersKept: userPurge.kept,
        ownerRoleEnsure: roleNotes,
        storageCleaned: { productsBucketObjectsRemoved: storageRemoved },
        integrity: {
          failedDeletes,
          zeroVerificationPass: zeroPass,
          userPurgePass: usersPass,
        },
        remainingProtectedData: protectedRemaining,
        fullDemoWalletRestore: walletNotes,
        walletZero: walletZeroNote,
        verificationCounts: verificationAfter,
        passFail: pass ? "PASS" : "FAIL",
        forbidden: PRODUCTION_LAUNCH_RESET_V1.forbidden,
      },
      null,
      2,
    ),
  );

  process.exit(pass ? 0 : 3);
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
