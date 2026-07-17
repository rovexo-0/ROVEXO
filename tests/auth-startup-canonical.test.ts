import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AUTH_GUEST_ENTRY_PATH, buildGuestAuthPath } from "@/lib/auth/guest-entry";
import { AUTH_ROUTES, AUTH_STARTUP } from "@/lib/auth/canonical";
import { AUTHENTICATED_HOME } from "@/lib/auth/redirects";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO canonical auth startup (Splash + Welcome removed)", () => {
  it("uses Login as the only guest entry", () => {
    expect(AUTH_GUEST_ENTRY_PATH).toBe("/login");
    expect(AUTH_ROUTES.login).toBe("/login");
    expect(AUTH_STARTUP.guestEntry).toBe("/login");
    expect(AUTH_STARTUP.authenticatedHome).toBe("/");
    expect(AUTHENTICATED_HOME).toBe("/");
    expect(buildGuestAuthPath("/wallet")).toBe("/login?next=%2Fwallet");
    expect(buildGuestAuthPath("/login")).toBe("/login");
    expect(buildGuestAuthPath("/welcome")).toBe("/login");
    expect(buildGuestAuthPath("/splash")).toBe("/login");
  });

  it("redirects Splash and Welcome away permanently", () => {
    expect(readSource("app/(auth)/splash/page.tsx")).toContain('permanentRedirect("/login")');
    expect(readSource("app/(auth)/welcome/page.tsx")).toContain('permanentRedirect("/login")');
    expect(readSource("app/manifest.ts")).toContain('start_url: "/"');
  });

  it("routes guests and logout to Login, post-auth to Homepage", () => {
    const middleware = readSource("lib/supabase/middleware.ts");
    const actions = readSource("lib/auth/actions.ts");
    const signout = readSource("app/auth/signout/route.ts");
    const redirects = readSource("lib/auth/redirects.ts");

    expect(middleware).toContain('loginUrl.pathname = "/login"');
    expect(middleware).toContain('pathname === "/splash"');
    expect(middleware).toContain('pathname === "/welcome"');
    expect(actions).toContain('redirect("/login")');
    expect(signout).toContain('new URL("/login"');
    expect(redirects).toContain('export const AUTHENTICATED_HOME = "/"');
  });

  it("declares removed startup routes in master spec", () => {
    expect([...AUTH_STARTUP.removedRoutes]).toEqual(["/splash", "/welcome"]);
  });
});
