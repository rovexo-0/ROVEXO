/**
 * Full Demo permanence — the two official certification accounts must never
 * be deleted, reset, or stripped of products / balances / permissions.
 */

import { isFullDemoEmail, FULL_DEMO_PERMANENCE_CONTRACT } from "@/lib/full-demo/canonical";

export class FullDemoPermanenceError extends Error {
  constructor(action: string) {
    super(
      `[FULL DEMO PERMANENCE] Refused to ${action}. ` +
        "ROVEXO LIVE BUYER and ROVEXO LIVE SELLER are permanent certification accounts. " +
        "DO NOT DELETE. DO NOT RESET. DO NOT REMOVE PRODUCTS, BALANCES, OR PERMISSIONS.",
    );
    this.name = "FullDemoPermanenceError";
  }
}

export function assertFullDemoNotDeletable(email: string | null | undefined, action = "delete"): void {
  if (isFullDemoEmail(email)) {
    throw new FullDemoPermanenceError(action);
  }
}

const FULL_DEMO_ALLOWED_RECOVERY_ACTIONS = new Set([
  "unsuspend",
  "restore",
  "verify",
]);

/**
 * Fail closed for every Super Admin action that could disable, lock, unverify,
 * reset, restrict, or strip capabilities from a Full Demo account.
 */
export function assertFullDemoActionAllowed(
  email: string | null | undefined,
  action: string,
): void {
  if (!isFullDemoEmail(email)) return;
  if (FULL_DEMO_ALLOWED_RECOVERY_ACTIONS.has(action)) return;
  throw new FullDemoPermanenceError(`${action} Full Demo Certification account`);
}

export function assertFullDemoUserIdNotDeletable(
  emailById: Map<string, string | null | undefined>,
  userId: string,
  action = "delete",
): void {
  assertFullDemoNotDeletable(emailById.get(userId) ?? null, action);
}

/** Slugs owned by Full Demo Accounts — never pause/delete in cleanup scripts. */
export function isFullDemoProtectedSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return /^demo-live-(?:buyer|seller)-\d{3}$/.test(slug);
}

export function isFullDemoPermanenceLocked(): boolean {
  return (
    FULL_DEMO_PERMANENCE_CONTRACT.neverDelete &&
    FULL_DEMO_PERMANENCE_CONTRACT.neverExpire &&
    FULL_DEMO_PERMANENCE_CONTRACT.neverDisable &&
    FULL_DEMO_PERMANENCE_CONTRACT.neverSuspend &&
    FULL_DEMO_PERMANENCE_CONTRACT.neverReset &&
    FULL_DEMO_PERMANENCE_CONTRACT.neverLock &&
    FULL_DEMO_PERMANENCE_CONTRACT.alwaysAvailable
  );
}
