import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  resolveAuthProviderSessionPhase,
} from "@/lib/auth/auth-provider-session-phase-v1";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("OPT-P0-PERF-07 guest API gating", () => {
  it("resolves AuthProvider session phases without treating PENDING as GUEST", () => {
    expect(resolveAuthProviderSessionPhase(null)).toBe("pending");
    expect(resolveAuthProviderSessionPhase({ ready: false, loading: true, profile: null })).toBe(
      "pending",
    );
    expect(resolveAuthProviderSessionPhase({ ready: true, loading: true, profile: null })).toBe(
      "pending",
    );
    expect(resolveAuthProviderSessionPhase({ ready: true, loading: false, profile: null })).toBe(
      "guest",
    );
    expect(
      resolveAuthProviderSessionPhase({
        ready: true,
        loading: false,
        profile: { id: "u1" },
      }),
    ).toBe("authenticated");
  });

  it("AuthProvider skips forced guest re-fetch and prepares caches on auth hydrate", () => {
    const auth = read("features/auth/providers/AuthProvider.tsx");
    expect(auth).toContain("loadProfileOnce(false)");
    expect(auth).not.toMatch(/loadProfileOnce\(true\)\s*;/);
    expect(auth).toContain("preparePrivateClientSessionCachesForAuthHydrate");
    expect(auth).toContain("export function clearClientSessionOnLogout");
    expect(auth).not.toContain("document.cookie");
  });

  it("logout paths clear private client session caches", () => {
    const files = [
      "features/account-center/components/AccountMenuSections.tsx",
      "features/account-center/components/AccountCenterLogoutButton.tsx",
      "features/dashboard/components/LogoutButton.tsx",
    ];
    for (const file of files) {
      const src = read(file);
      expect(src).toContain("clearClientSessionOnLogout");
      expect(src).toContain("signOut");
    }
    const ssot = read("lib/auth/private-client-session-cache-v1.ts");
    expect(ssot).toContain("invalidateSavedStatusCache");
    expect(ssot).toContain("clearInboxBadgeModuleCache");
    expect(ssot).toContain("discardBundleMirror");
  });

  it("badge provider gates fetchInboxBadgeCounts on AuthProvider phase", () => {
    const src = read("features/notifications/components/RealtimeNotificationProvider.tsx");
    expect(src).toContain("resolveAuthProviderSessionPhase");
    expect(src).toContain('sessionPhase === "guest"');
    expect(src).toContain('sessionPhase === "pending"');
    expect(src).toContain("clearPrivateClientSessionCachesOnLogout");
    expect(src).toContain("SIGNED_OUT");
    expect(src).toContain("SIGNED_IN");
    expect(src).toContain("rovexo:inbox-sync");
  });

  it("saved hydrate skips GET for guest and waits for PENDING", () => {
    const src = read("features/home/hooks/use-product-watchlist.ts");
    expect(src).toContain("resolveAuthProviderSessionPhase");
    expect(src).toContain('sessionPhase === "pending"');
    expect(src).toContain('sessionPhase === "guest"');
    expect(src).toContain("loadSavedSlugSet");
    expect(src).toContain('method: nextSaved ? "POST" : "DELETE"');
    expect(read("components/ui/ListingCard.tsx")).toContain("useProductWatchlist");
  });

  it("bundle hydrate discards mirror for guest and skips GET", () => {
    const src = read("features/product-detail/AddToBundleSheet.tsx");
    expect(src).toContain("resolveAuthProviderSessionPhase");
    expect(src).toContain('sessionPhase === "guest"');
    expect(src).toContain("writeBundleMirror(null)");
    expect(src).toContain("fetchBundleSnapshotShared");
  });

  it("does not weaken requireApiAuth or invent cookie auth", () => {
    const session = read("lib/auth/session.ts");
    expect(session).toContain('return NextResponse.json({ error: "Unauthorized" }, { status: 401 })');
    const cookies = read("lib/auth/session-cookies.ts");
    expect(cookies).toContain("httpOnly: true");
  });
});
