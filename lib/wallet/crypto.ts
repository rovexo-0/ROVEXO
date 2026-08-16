/**
 * Column-level encryption for sensitive bank details (sort code, account
 * number). Server-only.
 *
 * Wallet Security Certification v1.0 — FAIL CLOSED:
 *   - BANK_DETAILS_ENCRYPTION_KEY is required to encrypt or decrypt secrets.
 *   - Plaintext storage is forbidden.
 *
 * Ciphertext format:  "enc:v1:" + base64( iv(12) | authTag(16) | ciphertext )
 */

import crypto from "node:crypto";

const PREFIX = "enc:v1:";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function isUnusableSecret(raw: string): boolean {
  return (
    raw === "[SENSITIVE]" ||
    raw.startsWith("[SEN") ||
    raw === "placeholder" ||
    raw.endsWith("_placeholder")
  );
}

function getKey(): Buffer | null {
  const raw = process.env.BANK_DETAILS_ENCRYPTION_KEY?.trim();
  if (!raw || isUnusableSecret(raw)) return null;

  if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
    const hex = Buffer.from(raw, "hex");
    return hex.length === 32 ? hex : null;
  }

  const asB64 = Buffer.from(raw, "base64");
  if (asB64.length === 32) return asB64;

  // Owner-supplied secret that is not raw 32-byte hex/base64 — derive AES-256 key.
  // Never invent a key when the env value is missing.
  if (raw.length >= 16) {
    return crypto.createHash("sha256").update(raw, "utf8").digest();
  }

  return null;
}

export function isBankEncryptionConfigured(): boolean {
  return getKey() !== null;
}

function requireKey(): Buffer {
  const key = getKey();
  if (!key) {
    throw new Error(
      "BANK_DETAILS_ENCRYPTION_KEY is required. Refusing plaintext bank storage (Wallet Security Certification v1.0).",
    );
  }
  return key;
}

/** Encrypt a plaintext value. Throws if encryption key is missing or invalid. */
export function encryptSensitive(plaintext: string): string {
  const key = requireKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/** Decrypt a value produced by encryptSensitive. Rejects plaintext legacy rows. */
export function decryptSensitive(value: string): string {
  if (!value.startsWith(PREFIX)) {
    throw new Error(
      "Refusing to use plaintext bank details. Re-save the bank account with encryption enabled.",
    );
  }

  const key = requireKey();
  const raw = Buffer.from(value.slice(PREFIX.length), "base64");
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const data = raw.subarray(IV_BYTES + TAG_BYTES);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
