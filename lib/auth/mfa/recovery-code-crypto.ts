import { createHash, randomBytes } from "node:crypto";
import { MFA_TOTP_V1 } from "@/lib/auth/mfa/ssot";

export function recoveryPepper(): string {
  const explicit = process.env.MFA_RECOVERY_PEPPER?.trim();
  if (explicit) return explicit;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (service && service.length >= 16) {
    return createHash("sha256").update(`rovexo-mfa-recovery-v1:${service}`).digest("hex");
  }
  throw new Error("MFA recovery pepper unavailable.");
}

export function normalizeRecoveryCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function hashRecoveryCode(code: string): string {
  const normalized = normalizeRecoveryCode(code);
  return createHash("sha256")
    .update(`${recoveryPepper()}:${normalized}`)
    .digest("hex");
}

function formatRecoveryCode(raw: string): string {
  const size = MFA_TOTP_V1.recoveryCodeGroupSize;
  const chunks: string[] = [];
  for (let i = 0; i < raw.length; i += size) {
    chunks.push(raw.slice(i, i + size));
  }
  return chunks.join("-");
}

/** Generate plaintext recovery codes (shown once). */
export function generateRecoveryCodes(count = MFA_TOTP_V1.recoveryCodeCount): string[] {
  const codes: string[] = [];
  const seen = new Set<string>();
  while (codes.length < count) {
    const raw = randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
    const formatted = formatRecoveryCode(raw);
    const key = normalizeRecoveryCode(formatted);
    if (seen.has(key)) continue;
    seen.add(key);
    codes.push(formatted);
  }
  return codes;
}
