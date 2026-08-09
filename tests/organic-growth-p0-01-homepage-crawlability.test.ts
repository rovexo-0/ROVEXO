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
    expect(home).toContain("loadHomepageDocumentData");
    const loader = readSource("lib/homepage/load-homepage-document.ts");
    expect(loader).toContain("fetchHomepageFeed");
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

  it("homepage auth is optional and draft visual preview is isolated privately", () => {
    const home = readSource("app/(platform)/page.tsx");
    expect(home).not.toContain("getAuthContext");
    expect(home).not.toContain("requireAuth");
    expect(home).toContain("loadHomepageDocumentData");

    const draft = readSource("app/(platform)/homepage-visual-draft/page.tsx");
    expect(draft).toContain("getAuthContext");
    expect(draft).toContain('role === "super_admin"');

    const mw = readSource("middleware.ts");
    expect(mw).toContain('visualPreview") === "draft"');
    expect(mw).toContain("/homepage-visual-draft");

    const loader = readSource("lib/homepage/load-homepage-document.ts");
    expect(loader).toContain("fetchHomepageFeed");
    expect(loader).toContain("fetchShowcaseSellerSections");
  });
});
