import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTH_MODULE_VERSION,
  AUTH_ROUTES,
  AUTH_SPLASH,
} from "@/lib/auth/canonical";
import { AUTH_PROTECTED_PREFIXES, AUTH_PUBLIC_PREFIXES } from "@/lib/auth/protected-routes";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH v1 — splash screen", () => {
  it("exports canonical auth routes and splash timing", () => {
    expect(AUTH_MODULE_VERSION).toBe("v1.0-sprint1");
    expect(AUTH_ROUTES.splash).toBe("/splash");
    expect(AUTH_ROUTES.welcome).toBe("/welcome");
    expect(AUTH_ROUTES.home).toBe("/");
    expect(AUTH_SPLASH.fadeDurationMs).toBe(600);
    expect(AUTH_SPLASH.minDisplayMs).toBeGreaterThanOrEqual(600);
  });

  it("lists splash and welcome as public auth routes", () => {
    expect(AUTH_PUBLIC_PREFIXES).toContain("/splash");
    expect(AUTH_PUBLIC_PREFIXES).toContain("/welcome");
  });

  it("protects sell, wallet, checkout, orders, inbox, saved, business, admin", () => {
    const required = ["/sell", "/wallet", "/checkout", "/orders", "/messages", "/saved", "/business", "/admin", "/super-admin"];
    for (const prefix of required) {
      expect(AUTH_PROTECTED_PREFIXES).toContain(prefix);
    }
  });

  it("implements splash page and bootstrap flow", () => {
    const splashPage = readSource("app/(auth)/splash/page.tsx");
    const splashScreen = readSource("features/auth/components/SplashScreen.tsx");
    const bootstrap = readSource("lib/auth/bootstrap.ts");

    expect(splashPage).toContain("SplashScreen");
    expect(splashScreen).toContain("resolveSplashDestination");
    expect(splashScreen).toContain("RovexoAppIconMark");
    expect(splashScreen).toContain("auth-splash--exit");
    expect(bootstrap).toContain("getSession");
    expect(bootstrap).toContain("AUTH_ROUTES.welcome");
    expect(bootstrap).toContain("AUTH_ROUTES.home");
  });

  it("uses fade-only splash CSS (no scale or bounce)", () => {
    const css = readSource("styles/rovexo/auth-v1.css");
    expect(css).toContain("auth-splash-fade-in");
    expect(css).not.toMatch(/scale\(/);
    expect(css).not.toMatch(/bounce/);
    expect(css).toContain("opacity");
  });

  it("exposes reusable auth components without duplicating next/image", () => {
    const index = readSource("components/auth/index.ts");
    expect(index).toContain("AuthLayout");
    expect(index).toContain("PrimaryButton");
    expect(index).toContain("SocialLogin");
  });

  it("bypasses AuthShell on splash route only", () => {
    const routeLayout = readSource("components/auth/AuthRouteLayout.tsx");
    expect(routeLayout).toContain("AUTH_ROUTES.splash");
    expect(routeLayout).toContain("AuthShell");
  });
});
