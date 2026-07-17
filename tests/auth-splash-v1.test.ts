import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION, AUTH_ROUTES, AUTH_STARTUP } from "@/lib/auth/canonical";
import { AUTH_PROTECTED_PREFIXES, AUTH_PUBLIC_PREFIXES } from "@/lib/auth/protected-routes";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH_MASTER_SPEC v1.0 — Splash REMOVED", () => {
  it("removes Splash from canonical startup", () => {
    expect(AUTH_MASTER_SPEC_VERSION).toBe("v1.0");
    expect(AUTH_MODULE_VERSION).toBe("v1.0");
    expect(AUTH_STARTUP.guestEntry).toBe("/login");
    expect(AUTH_STARTUP.removedRoutes).toContain("/splash");
    expect(AUTH_MASTER_SPEC.splash.destinations.guest).toBe("/login");
    expect(AUTH_ROUTES.home).toBe("/");
  });

  it("does not list Splash as a public auth prefix", () => {
    expect(AUTH_PUBLIC_PREFIXES).not.toContain("/splash");
    expect(AUTH_PUBLIC_PREFIXES).toContain("/login");
  });

  it("protects sell, wallet, checkout, orders, inbox, saved, business, admin", () => {
    for (const prefix of [
      "/sell",
      "/wallet",
      "/checkout",
      "/orders",
      "/messages",
      "/inbox",
      "/saved",
      "/business",
      "/admin",
      "/super-admin",
    ]) {
      expect(AUTH_PROTECTED_PREFIXES).toContain(prefix);
    }
  });

  it("permanently redirects /splash to Login", () => {
    expect(readSource("app/(auth)/splash/page.tsx")).toContain('permanentRedirect("/login")');
    expect(readSource("app/manifest.ts")).toContain('start_url: "/"');
    expect(readSource("lib/auth/bootstrap.ts")).toContain("AUTH_STARTUP.guestEntry");
  });
});
