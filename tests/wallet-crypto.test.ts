import { afterEach, beforeEach, describe, expect, it } from "vitest";
import crypto from "node:crypto";

const KEY = crypto.randomBytes(32).toString("base64");

async function loadModule() {
  // Re-import fresh so the module reads the current env each test run.
  return import("@/lib/wallet/crypto");
}

describe("bank details column encryption", () => {
  const original = process.env.BANK_DETAILS_ENCRYPTION_KEY;

  afterEach(() => {
    process.env.BANK_DETAILS_ENCRYPTION_KEY = original;
  });

  describe("with a key set", () => {
    beforeEach(() => {
      process.env.BANK_DETAILS_ENCRYPTION_KEY = KEY;
    });

    it("reports encryption as configured", async () => {
      const { isBankEncryptionConfigured } = await loadModule();
      expect(isBankEncryptionConfigured()).toBe(true);
    });

    it("round-trips a value and does not store plaintext", async () => {
      const { encryptSensitive, decryptSensitive } = await loadModule();
      const secret = "12345678";
      const encrypted = encryptSensitive(secret);

      expect(encrypted).toMatch(/^enc:v1:/);
      expect(encrypted).not.toContain(secret);
      expect(decryptSensitive(encrypted)).toBe(secret);
    });

    it("produces different ciphertext each time (random IV)", async () => {
      const { encryptSensitive } = await loadModule();
      expect(encryptSensitive("123456")).not.toBe(encryptSensitive("123456"));
    });
  });

  describe("without a key set", () => {
    beforeEach(() => {
      delete process.env.BANK_DETAILS_ENCRYPTION_KEY;
    });

    it("reports encryption as not configured and passes plaintext through", async () => {
      const { encryptSensitive, decryptSensitive, isBankEncryptionConfigured } = await loadModule();
      expect(isBankEncryptionConfigured()).toBe(false);
      expect(encryptSensitive("123456")).toBe("123456");
      expect(decryptSensitive("123456")).toBe("123456");
    });
  });
});
