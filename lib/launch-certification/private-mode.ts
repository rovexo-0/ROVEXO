import type { Metadata } from "next";
import { PRIVATE_MODE_RULES } from "@/lib/launch-certification/canonical";
import { parseApprovedTesterEmails } from "@/lib/homepage/config";

/** Env: ROVEXO_LAUNCH_PRIVATE_MODE=1 during certification phase (before official launch). */
export function isLaunchPrivateMode(): boolean {
  return (
    process.env.ROVEXO_LAUNCH_PRIVATE_MODE === "1" ||
    process.env.ROVEXO_LAUNCH_PRIVATE_MODE === "true" ||
    process.env.NEXT_PUBLIC_ROVEXO_LAUNCH_PRIVATE_MODE === "1" ||
    process.env.NEXT_PUBLIC_ROVEXO_LAUNCH_PRIVATE_MODE === "true"
  );
}

export function isLaunchAdvertisingEnabled(): boolean {
  if (!isLaunchPrivateMode()) return true;
  return PRIVATE_MODE_RULES.advertisements;
}

export function isGoogleIndexingEnabled(): boolean {
  return !isLaunchPrivateMode();
}

export function isPublicRegistrationEnabled(): boolean {
  // Playwright certification must exercise the Register screen; production
  // private-mode still disables public registration via PRIVATE_MODE_RULES.
  if (process.env.PLAYWRIGHT_E2E === "1" || process.env.E2E_TEST === "1") return true;
  if (!isLaunchPrivateMode()) return true;
  return PRIVATE_MODE_RULES.publicRegistration;
}

/** Guest browsing is optional during certification — enabled unless explicitly disabled. */
export function isGuestBrowsingEnabled(): boolean {
  if (!isLaunchPrivateMode()) return true;
  if (
    process.env.ROVEXO_CERTIFICATION_GUEST_BROWSING === "0" ||
    process.env.ROVEXO_CERTIFICATION_GUEST_BROWSING === "false"
  ) {
    return false;
  }
  return true;
}

export function resolveLaunchPrivateModeRobots(): Metadata["robots"] | undefined {
  if (!isLaunchPrivateMode()) return undefined;
  return { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } };
}

export function isApprovedLaunchTester(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = parseApprovedTesterEmails();
  if (allowlist.size === 0) return false;
  return allowlist.has(email.trim().toLowerCase());
}

export function canAccessCertificationPlatform(
  email: string | null | undefined,
  isAuthenticated: boolean,
): boolean {
  if (!isLaunchPrivateMode()) return true;
  if (isAuthenticated && isApprovedLaunchTester(email)) return true;
  if (!isAuthenticated && isGuestBrowsingEnabled()) return true;
  return false;
}

export function resolveLaunchPrivateModeState() {
  return {
    active: isLaunchPrivateMode(),
    rules: PRIVATE_MODE_RULES,
    approvedTesterCount: parseApprovedTesterEmails().size,
    publicRegistrationEnabled: isPublicRegistrationEnabled(),
    guestBrowsingEnabled: isGuestBrowsingEnabled(),
    googleIndexingEnabled: isGoogleIndexingEnabled(),
  };
}
