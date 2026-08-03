import "server-only";

import { randomUUID, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hashRecoveryCode,
  normalizeRecoveryCode,
} from "@/lib/auth/mfa/recovery-code-crypto";

export {
  generateRecoveryCodes,
  hashRecoveryCode,
  normalizeRecoveryCode,
} from "@/lib/auth/mfa/recovery-code-crypto";

type RecoveryCodeRow = {
  id: string;
  code_hash: string;
  batch_id: string;
  used_at: string | null;
};

export async function replaceRecoveryCodesForUser(
  userId: string,
  plaintextCodes: string[],
): Promise<{ batchId: string }> {
  const admin = createAdminClient();
  const batchId = randomUUID();
  const rows = plaintextCodes.map((code) => ({
    user_id: userId,
    code_hash: hashRecoveryCode(code),
    batch_id: batchId,
  }));

  const { error: deleteError } = await admin
    .from("mfa_recovery_codes" as never)
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error("Unable to invalidate previous recovery codes.");
  }

  const { error: insertError } = await admin.from("mfa_recovery_codes" as never).insert(rows as never);

  if (insertError) {
    throw new Error("Unable to store recovery codes.");
  }

  return { batchId };
}

export async function invalidateAllRecoveryCodes(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("mfa_recovery_codes" as never)
    .delete()
    .eq("user_id", userId);
  if (error) {
    throw new Error("Unable to invalidate recovery codes.");
  }
}

export async function countUnusedRecoveryCodes(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("mfa_recovery_codes" as never)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("used_at", null);
  if (error) return 0;
  return count ?? 0;
}

/**
 * Consume a one-time recovery code. Returns true when a valid unused code matched.
 */
export async function consumeRecoveryCode(
  userId: string,
  rawCode: string,
): Promise<boolean> {
  const normalized = normalizeRecoveryCode(rawCode);
  if (normalized.length < 8) return false;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mfa_recovery_codes" as never)
    .select("id, code_hash, batch_id, used_at")
    .eq("user_id", userId)
    .is("used_at", null);

  if (error || !data) return false;

  const targetHash = hashRecoveryCode(normalized);
  const targetBuf = Buffer.from(targetHash, "hex");

  const rows = data as RecoveryCodeRow[];
  for (const row of rows) {
    const rowBuf = Buffer.from(row.code_hash, "hex");
    if (rowBuf.length !== targetBuf.length) continue;
    if (!timingSafeEqual(rowBuf, targetBuf)) continue;

    const { error: updateError } = await admin
      .from("mfa_recovery_codes" as never)
      .update({ used_at: new Date().toISOString() } as never)
      .eq("id", row.id)
      .is("used_at", null);

    if (updateError) return false;
    return true;
  }

  return false;
}
