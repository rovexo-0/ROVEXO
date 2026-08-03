import { describe, expect, it } from "vitest";
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  normalizeRecoveryCode,
} from "@/lib/auth/mfa/recovery-code-crypto";
import { isMfaPendingAllowedPath, MFA_TOTP_V1, mfaChallengeHref } from "@/lib/auth/mfa/ssot";

describe("MFA TOTP v1.0 SSOT", () => {
  it("disables remember device", () => {
    expect(MFA_TOTP_V1.rememberDeviceEnabled).toBe(false);
  });

  it("allowlists only MFA challenge surfaces", () => {
    expect(isMfaPendingAllowedPath("/login/mfa")).toBe(true);
    expect(isMfaPendingAllowedPath("/api/auth/mfa/verify")).toBe(true);
    expect(isMfaPendingAllowedPath("/auth/signout")).toBe(true);
    expect(isMfaPendingAllowedPath("/")).toBe(false);
    expect(isMfaPendingAllowedPath("/account")).toBe(false);
    expect(isMfaPendingAllowedPath("/checkout")).toBe(false);
  });

  it("builds challenge href with sanitized next", () => {
    expect(mfaChallengeHref("/account")).toBe("/login/mfa?next=%2Faccount");
    expect(mfaChallengeHref("https://evil.example")).toBe("/login/mfa");
  });
});

describe("MFA recovery codes", () => {
  it("generates the configured count of unique codes", () => {
    process.env.MFA_RECOVERY_PEPPER = "test-pepper-rovexo-mfa-v1";
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(MFA_TOTP_V1.recoveryCodeCount);
    expect(new Set(codes.map(normalizeRecoveryCode)).size).toBe(codes.length);
  });

  it("hashes normalized recovery codes stably", () => {
    process.env.MFA_RECOVERY_PEPPER = "test-pepper-rovexo-mfa-v1";
    const a = hashRecoveryCode("ABCD-EFGH");
    const b = hashRecoveryCode("abcd efgh");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
