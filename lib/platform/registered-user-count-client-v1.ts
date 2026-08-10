import { formatCardViews } from "@/lib/listing-card/format";
import { isProtectedDemoActor } from "@/lib/full-demo/security";
import { DEMO_EMAIL_DOMAIN, DEMO_USERS } from "@/lib/demo-environment/config";
import { FULL_DEMO_ACCOUNTS } from "@/lib/full-demo/canonical";

/**
 * Client-safe Registered User Counter contract (Owner COD SÂNGE).
 * Canonical table remains public.profiles — never a second users source.
 *
 * Exclusion (public counter only — not a second auth system):
 * 1. `isProtectedDemoActor` = FULL_DEMO_ACCOUNTS + @demo.rovexo.co.uk
 * 2. E2E / certification `support+live-*@rovexo.co.uk` (Owner pipeline protection)
 * No profile.is_demo column exists.
 */

/** Exact E2E pattern — do not broaden. */
export const SUPPORT_LIVE_TEST_EMAIL_PATTERN = /^support\+live-.+@rovexo\.co\.uk$/i;

/** PostgREST ilike pattern for the same selector (literal + in pattern). */
export const SUPPORT_LIVE_TEST_EMAIL_ILIKE = "support+live-%@rovexo.co.uk";

export function isSupportLiveTestAccountEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPPORT_LIVE_TEST_EMAIL_PATTERN.test(email.trim().toLowerCase());
}

export const REGISTERED_USER_COUNT_V1 = {
  version: "v1.2",
  canonicalTable: "profiles" as const,
  apiPath: "/api/platform/registered-user-count",
  realtimeChannel: "platform:registered-user-count",
  realtimeTable: "profiles" as const,
  demoMarker: "isProtectedDemoActor" as const,
  demoEmailDomain: DEMO_EMAIL_DOMAIN,
  supportLiveTestPattern: SUPPORT_LIVE_TEST_EMAIL_ILIKE,
} as const;

/** Compact display — same deterministic K/M rules as listing views. */
export function formatRegisteredUserCount(count: number): string {
  return formatCardViews(count);
}

/**
 * Official demo/test emails from existing registries (not guessed).
 * Full Demo + DEMO_USERS allowlists — used for SQL `not.in` exclusion.
 */
export function listCanonicalDemoExclusionEmails(): string[] {
  const emails = new Set<string>();
  for (const account of FULL_DEMO_ACCOUNTS) {
    emails.add(account.email.trim().toLowerCase());
  }
  for (const user of DEMO_USERS) {
    emails.add(user.email.trim().toLowerCase());
  }
  return [...emails];
}

/** True when the email must never appear in the public registered-user counter. */
export function isCanonicalDemoAccountEmail(email: string | null | undefined): boolean {
  if (isProtectedDemoActor(email)) return true;
  if (isSupportLiveTestAccountEmail(email)) return true;
  return false;
}

export function isCountableRegisteredProfile(row: {
  account_status?: string | null;
  deleted_at?: string | null;
  email?: string | null;
}): boolean {
  if (row.deleted_at) return false;
  if (row.account_status === "deleted") return false;
  if (isCanonicalDemoAccountEmail(row.email)) return false;
  return true;
}
