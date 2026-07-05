/**
 * Column-level encryption for sensitive bank details (sort code, account
 * number). Server-only.
 *
 * We encrypt in the application layer with AES-256-GCM rather than in-database
 * (pgcrypto) so that:
 *   - the key never lives in Postgres / migrations (it stays in the app env),
 *   - it works transparently with our JS write path (no SQL RPC required),
 *   - authenticated encryption (GCM) protects against tampering.
 *
 * Ciphertext format:  "enc:v1:" + base64( iv(12) | authTag(16) | ciphertext )
 *
 * Backwards/forwards compatible: values without the "enc:v1:" prefix are
 * treated as plaintext (dev environments with no key set), so existing rows and
 * key-less local dev keep working. Production MUST set
 * BANK_DETAILS_ENCRYPTION_KEY.
 */

import crypto from "node:crypto";

const PREFIX = "enc:v1:";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey(): Buffer | null {
  const raw = process.env.BANK_DETAILS_ENCRYPTION_KEY?.trim();
  if (!raw) return null;

  const buffer =
    raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)
      ? Buffer.from(raw, "hex")
      : Buffer.from(raw, "base64");

  return buffer.length === 32 ? buffer : null;
}

export function isBankEncryptionConfigured(): boolean {
  return getKey() !== null;
}

/** Encrypt a plaintext value. Returns plaintext unchanged if no key is set. */
export function encryptSensitive(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;

  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/** Decrypt a value produced by encryptSensitive. Plaintext passes through. */
export function decryptSensitive(value: string): string {
  if (!value.startsWith(PREFIX)) return value;

  const key = getKey();
  if (!key) {
    throw new Error("BANK_DETAILS_ENCRYPTION_KEY is required to decrypt bank details.");
  }

  const raw = Buffer.from(value.slice(PREFIX.length), "base64");
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const data = raw.subarray(IV_BYTES + TAG_BYTES);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
