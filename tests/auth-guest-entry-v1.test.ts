import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AUTH_GUEST_ENTRY_PATH, buildGuestAuthPath } from "@/lib/auth/guest-entry";
import { AUTH_ROUTES } from "@/lib/auth/canonical";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH_MASTER_SPEC v1.0 — guest entry + logout", () => {
  it("locks guest entry to Welcome", () => {
    expect(AUTH_GUEST_ENTRY_PATH).toBe(AUTH_ROUTES.welcome);
    expect(AUTH_ROUTES.welcome).toBe("/welcome");
    expect(buildGuestAuthPath("/wallet")).toBe("/welcome?next=%2Fwallet");
    expect(buildGuestAuthPath("/login")).toBe("/welcome");
  });

  it("routes middleware protected guests and logout to Welcome", () => {
    const middleware = readSource("lib/supabase/middleware.ts");
    const actions = readSource("lib/auth/actions.ts");
    const signout = readSource("app/auth/signout/route.ts");

    expect(middleware).toContain('welcomeUrl.pathname = "/welcome"');
    expect(middleware).not.toMatch(/!user && isProtected[\s\S]*?pathname = "\/login"/);
    expect(actions).toContain('redirect("/welcome")');
    expect(signout).toContain('new URL("/welcome"');
  });
});
