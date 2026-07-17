import { describe, expect, it } from "vitest";
import { AUTH_GUEST_ENTRY_PATH, buildGuestAuthPath } from "@/lib/auth/guest-entry";
import { AUTH_ROUTES } from "@/lib/auth/canonical";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("AUTH guest entry v1 — Login (Welcome removed)", () => {
  it("locks guest entry to Login", () => {
    expect(AUTH_GUEST_ENTRY_PATH).toBe(AUTH_ROUTES.login);
    expect(AUTH_ROUTES.login).toBe("/login");
    expect(buildGuestAuthPath("/wallet")).toBe("/login?next=%2Fwallet");
    expect(buildGuestAuthPath("/login")).toBe("/login");
  });

  it("wires middleware, logout, and signout to Login", () => {
    const middleware = readFileSync(join(process.cwd(), "lib/supabase/middleware.ts"), "utf8");
    const actions = readFileSync(join(process.cwd(), "lib/auth/actions.ts"), "utf8");
    const signout = readFileSync(join(process.cwd(), "app/auth/signout/route.ts"), "utf8");
    expect(middleware).toContain('loginUrl.pathname = "/login"');
    expect(actions).toContain('redirect("/login")');
    expect(signout).toContain('new URL("/login"');
  });
});
