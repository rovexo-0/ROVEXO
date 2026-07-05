import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "crypto";
import { tryGetSupabaseServiceRoleKey } from "@/lib/supabase/env";

const ALGORITHM = "aes-256-gcm";
const KEY_SALT = "rovexo-staff-pii";

function deriveKey(): Buffer {
  const secret =
    process.env.STAFF_PII_SECRET?.trim() ??
    tryGetSupabaseServiceRoleKey() ??
    "rovexo-dev-staff-pii-key";
  return scryptSync(secret, KEY_SALT, 32);
}

export function hashStaffSearchValue(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function encryptStaffPii(payload: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptStaffPii(blob: string | null | undefined): string | null {
  if (!blob) return null;
  try {
    const key = deriveKey();
    const buffer = Buffer.from(blob, "base64");
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function maskIpAddress(ip: string | null | undefined): string | null {
  if (!ip?.trim()) return null;
  if (ip.includes(":")) {
    return "************";
  }
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return "***********";
}
