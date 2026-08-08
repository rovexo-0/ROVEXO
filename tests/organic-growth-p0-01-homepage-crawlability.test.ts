import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_PROTECTED_PREFIXES } from "@/lib/auth/protected-routes";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Organic Growth P0-01 — Homepage crawlability", () => {
  it("guest `/` is not redirected to `/login` in Supabase middleware", () => {
    const middleware = readSource("lib/supabase/middleware.ts");
    expect(middleware).not.toMatch(
      /if\s*\(\s*!user\s*&&\s*\(\s*pathname\s*===\s*["']\/["']\s*\|\|\s*pathname\s*===\s*["']["']\s*\)\s*\)/,
    );
    expect(middleware).not.toContain(
      "Cold start: logged-out users opening the app land on Login",
    );
    expect(middleware).toContain('AUTH_PROTECTED_PREFIXES');
    expect(middleware).toContain("P0-01");
  });

  it("canonical Homepage remains the sole `/` page implementation", () => {
    expect(existsSync(join(process.cwd(), "app/(platform)/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/page.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "app/(platform)/home/page.tsx"))).toBe(false);
    const home = readSource("app/(platform)/page.tsx");
    expect(home).toContain("CanonicalHomepage");
    expect(home).toContain("fetchHomepageFeed");
  });

  it("protected prefixes remain auth-gated (account, wallet, orders, inbox, sell, admin, super-admin)", () => {
    for (const prefix of [
      "/account",
      "/wallet",
      "/orders",
      "/inbox",
      "/sell",
      "/admin",
      "/super-admin",
    ] as const) {
      expect(AUTH_PROTECTED_PREFIXES).toContain(prefix);
    }

    const middleware = readSource("lib/supabase/middleware.ts");
    expect(middleware).toContain("if (!user && isProtected && !isApiRoute)");
    expect(middleware).toContain('loginUrl.pathname = "/login"');
  });

  it("homepage auth is optional and limited to draft visual preview", () => {
    const home = readSource("app/(platform)/page.tsx");
    expect(home).toContain('visualPreview === "draft"');
    expect(home).toContain("getAuthContext");
    expect(home).toContain("fetchHomepageFeed");
    expect(home).toContain("fetchShowcaseSellerSections");
    expect(home).not.toContain("requireAuth");
  });
});
