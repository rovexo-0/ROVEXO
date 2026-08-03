/**
 * ROVEXO Two-Factor Authentication (TOTP) v1.0 — Canonical SSOT
 *
 * Uses official Supabase Auth MFA APIs only.
 * Remember Device is explicitly disabled in v1.
 */

import { sanitizeNextPath } from "@/lib/auth/redirects";

export const MFA_TOTP_V1 = {
  version: "1.0",
  factorType: "totp" as const,
  friendlyName: "ROVEXO Authenticator",
  challengePath: "/login/mfa",
  securityPath: "/account/security/two-factor",
  apiPrefix: "/api/auth/mfa",
  recoveryCodeCount: 10,
  recoveryCodeGroupSize: 4,
  /** Remember Device — NOT in v1. */
  rememberDeviceEnabled: false,
} as const;

/** Paths allowed while session is AAL1 but MFA step-up is required. */
export const MFA_PENDING_ALLOWLIST = [
  MFA_TOTP_V1.challengePath,
  MFA_TOTP_V1.apiPrefix,
  "/auth/signout",
  "/auth/callback",
] as const;

export function isMfaPendingAllowedPath(pathname: string): boolean {
  return MFA_PENDING_ALLOWLIST.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function mfaChallengeHref(next?: string | null): string {
  const destination = sanitizeNextPath(next, "/");
  if (destination === "/") {
    return MFA_TOTP_V1.challengePath;
  }
  return `${MFA_TOTP_V1.challengePath}?next=${encodeURIComponent(destination)}`;
}
