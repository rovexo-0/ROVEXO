/**
 * ROVEXO GLOBAL FAIL CLOSED ENGINE v1.0 (LOCK) — tests.
 */

import { describe, expect, it } from "vitest";
import {
  FAIL_CLOSED_COPY,
  FAIL_CLOSED_ENGINE_NAME,
  isFailClosedCrashPreventionActive,
  isUnsafeUserFacingErrorText,
  resolveFailClosedState,
  toUserSafeFailClosedMessage,
  getFailClosedEngineSnapshot,
} from "@/lib/fail-closed";
import {
  getFailClosedEngineSnapshot as masterSnapshot,
  registerFailClosedEngine,
  toUserSafeFailClosedMessage as masterSafe,
} from "@/lib/master-engine";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relative: string): string {
  return readFileSync(join(process.cwd(), relative), "utf8");
}

describe("ROVEXO GLOBAL FAIL CLOSED ENGINE v1.0 (LOCK)", () => {
  it("is always crash-prevention active", () => {
    expect(FAIL_CLOSED_ENGINE_NAME).toBe("ROVEXO GLOBAL FAIL CLOSED ENGINE");
    expect(isFailClosedCrashPreventionActive()).toBe(true);
    expect(getFailClosedEngineSnapshot().crashPreventionActive).toBe(true);
    registerFailClosedEngine();
    expect(masterSnapshot().featureId).toBe("global-fail-closed");
  });

  it("never returns internal error text to users", () => {
    const leaks = [
      "SUPABASE_SERVICE_ROLE_KEY is missing",
      "createAdminClient failed",
      "Database connection ECONNREFUSED",
      "at Object.createServiceRoleClient (/lib/supabase/admin.ts:24)",
      "process.env.STRIPE_SECRET_KEY",
      "sb_secret_abc123",
    ];

    for (const leak of leaks) {
      expect(isUnsafeUserFacingErrorText(leak)).toBe(true);
      const safe = toUserSafeFailClosedMessage(new Error(leak));
      expect(safe.title).toBe(FAIL_CLOSED_COPY.title);
      expect(safe.body).toBe(FAIL_CLOSED_COPY.body);
      expect(safe.hint).toBe(FAIL_CLOSED_COPY.hint);
      expect(JSON.stringify(safe)).not.toMatch(/SUPABASE|SERVICE_ROLE|admin|stack|ECONNREFUSED/i);
      expect(masterSafe(new Error(leak)).body).toBe(FAIL_CLOSED_COPY.body);
    }
  });

  it("resolves soft-fail state without exposing internals", () => {
    const state = resolveFailClosedState("wallet", new Error("SECRET KEY missing"));
    expect(state.softFail).toBe(true);
    expect(state.exposeInternals).toBe(false);
    expect(state.message.safe).toBe(true);
  });

  it("app error boundaries never render error.message", () => {
    const files = [
      "app/error.tsx",
      "app/global-error.tsx",
      "app/(platform)/wallet/error.tsx",
      "app/(platform)/settings/error.tsx",
    ];
    for (const file of files) {
      const src = readSource(file);
      expect(src).toContain("FailClosedPanel");
      expect(src).not.toMatch(/\{error\.message/);
      expect(src).not.toMatch(/error\.message\s*\|\|/);
    }
    const userProfileError = readSource("app/(platform)/user/[username]/error.tsx");
    expect(userProfileError).toContain('data-fail-closed="empty-only"');
    expect(userProfileError).not.toMatch(/\{error\.message/);
  });

  it("Account Settings profile details never hard-crash on missing SERVICE_ROLE", () => {
    const service = readSource("lib/profile/service.ts");
    expect(service).toContain("tryCreateAdminClient");
    expect(service).not.toMatch(/createAdminClient\(\)/);
    expect(service).toContain("never throw");
    const route = readSource("app/(platform)/account/profile/page.tsx");
    expect(route).toContain("FailClosedPanel");
    expect(route).toContain("profileDetailsFromSession");
    expect(route).not.toContain('redirect("/login?next=/account/profile")');
  });
});
