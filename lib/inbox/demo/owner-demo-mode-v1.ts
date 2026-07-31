/**
 * ROVEXO Owner Demo Mode v1.0
 *
 * STATUS: CANONICAL · DEFAULT OFF
 *
 * Messages lifecycle / Conversation mockup fixtures may appear in Inbox ONLY when:
 *   1. Authenticated Owner account
 *   2. role === super_admin
 *   3. Explicit Owner Demo Mode enabled (cookie + localStorage)
 *
 * Normal users / Super Admin with Demo OFF → Supabase conversations only.
 */

export const OWNER_DEMO_MODE_V1 = {
  id: "owner-demo-mode-v1",
  version: "1.0.0",
  defaultEnabled: false as const,
  /** Cookie readable by Server Components (conversation demo routes). */
  cookieName: "rovexo_owner_demo_mode",
  /** Client mirror for Inbox merge gate. */
  localStorageKey: "rovexo:owner-demo-mode",
  superAdminRoute: "/super-admin/owner-demo-mode",
} as const;

export type OwnerDemoModeGateInput = {
  authenticated: boolean;
  role: string | null | undefined;
  ownerDemoModeEnabled: boolean;
};

/** Pure gate — default OFF unless all three conditions pass. */
export function shouldShowOwnerDemoInboxRows(input: OwnerDemoModeGateInput): boolean {
  if (!input.authenticated) return false;
  if (input.role !== "super_admin") return false;
  if (!input.ownerDemoModeEnabled) return false;
  return true;
}

export function parseOwnerDemoModeFlag(raw: string | null | undefined): boolean {
  if (!raw) return OWNER_DEMO_MODE_V1.defaultEnabled;
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "on";
}

/** Browser-only. Returns default OFF when storage unavailable. */
export function readOwnerDemoModeFromBrowser(): boolean {
  if (typeof window === "undefined") return OWNER_DEMO_MODE_V1.defaultEnabled;
  try {
    const fromStorage = window.localStorage.getItem(OWNER_DEMO_MODE_V1.localStorageKey);
    if (fromStorage != null) return parseOwnerDemoModeFlag(fromStorage);
  } catch {
    /* ignore */
  }
  try {
    const match = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${OWNER_DEMO_MODE_V1.cookieName}=`));
    if (match) return parseOwnerDemoModeFlag(match.split("=").slice(1).join("="));
  } catch {
    /* ignore */
  }
  return OWNER_DEMO_MODE_V1.defaultEnabled;
}

/** Browser-only. Persists flag for client Inbox + server conversation routes. */
export function writeOwnerDemoModeToBrowser(enabled: boolean): void {
  if (typeof window === "undefined") return;
  const value = enabled ? "1" : "0";
  try {
    window.localStorage.setItem(OWNER_DEMO_MODE_V1.localStorageKey, value);
  } catch {
    /* ignore */
  }
  try {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${OWNER_DEMO_MODE_V1.cookieName}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(
      new CustomEvent("rovexo:owner-demo-mode", { detail: { enabled } }),
    );
  } catch {
    /* ignore */
  }
}
