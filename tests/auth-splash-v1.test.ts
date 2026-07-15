import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTH_MASTER_SPEC,
  AUTH_MASTER_SPEC_VERSION,
} from "@/lib/auth/master-spec";
import {
  AUTH_MODULE_VERSION,
  AUTH_ROUTES,
  AUTH_SPLASH,
} from "@/lib/auth/canonical";
import { AUTH_PROTECTED_PREFIXES, AUTH_PUBLIC_PREFIXES } from "@/lib/auth/protected-routes";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH_MASTER_SPEC v1.0 — splash screen", () => {
  it("locks AUTH_MASTER_SPEC v1.0 splash contract", () => {
    expect(AUTH_MASTER_SPEC_VERSION).toBe("v1.0");
    expect(AUTH_MODULE_VERSION).toBe("v1.0");
    expect(AUTH_MASTER_SPEC.splash.phases).toEqual([
      "initialize_app",
      "initialize_supabase",
      "restore_session",
    ]);
    expect(AUTH_MASTER_SPEC.splash.motion).toBe("fade_only");
    expect(AUTH_MASTER_SPEC.splash.prohibitedMotion).toContain("spinner");
    expect(AUTH_ROUTES.splash).toBe("/splash");
    expect(AUTH_ROUTES.welcome).toBe("/welcome");
    expect(AUTH_ROUTES.home).toBe("/");
    expect(AUTH_SPLASH.fadeDurationMs).toBe(220);
    expect(AUTH_SPLASH.minDisplayMs).toBe(600);
    expect(AUTH_SPLASH.maxWaitMs).toBe(1200);
  });

  it("lists splash and welcome as public auth routes", () => {
    expect(AUTH_PUBLIC_PREFIXES).toContain("/splash");
    expect(AUTH_PUBLIC_PREFIXES).toContain("/welcome");
  });

  it("protects sell, wallet, checkout, orders, inbox, saved, business, admin", () => {
    const required = [
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
    ];
    for (const prefix of required) {
      expect(AUTH_PROTECTED_PREFIXES).toContain(prefix);
    }
  });

  it("implements splash bootstrap phases and destinations", () => {
    const splashPage = readSource("app/(auth)/splash/page.tsx");
    const splashLayout = readSource("app/(auth)/splash/layout.tsx");
    const splashScreen = readSource("features/auth/components/SplashScreen.tsx");
    const bootstrap = readSource("lib/auth/bootstrap.ts");

    expect(splashPage).toContain("SplashScreen");
    expect(splashLayout).toContain("themeColor");
    expect(splashLayout).toContain("#ffffff");
    expect(splashLayout).toContain("auth-splash--ssr");
    expect(splashScreen).toContain("resolveSplashDestination");
    expect(splashScreen).toContain("RovexoAppIconMark");
    expect(splashScreen).toContain("auth-splash--exit");
    expect(splashScreen).toContain("data-auth-spec");
    expect(bootstrap).toContain("initialize_app");
    expect(bootstrap).toContain("initialize_supabase");
    expect(bootstrap).toContain("restore_session");
    expect(bootstrap).toContain("getSession");
    expect(bootstrap).toContain("AUTH_ROUTES.welcome");
    expect(bootstrap).toContain("authenticatedVerified");
  });

  it("uses fade-only splash CSS (no scale, bounce, or spinner)", () => {
    const css = readSource("styles/rovexo/auth-v1.css");
    expect(css).toContain("auth-splash-fade-in");
    expect(css).not.toMatch(/scale\(/);
    expect(css).not.toMatch(/bounce/);
    expect(css).not.toContain("spinner");
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

  it("never paints homepage skeleton as splash Suspense fallback", () => {
    const rootLoading = readSource("app/loading.tsx");
    const splashLoading = readSource("app/(auth)/splash/loading.tsx");
    const authLoading = readSource("app/(auth)/loading.tsx");
    const firstPaint = readSource("components/auth/SplashFirstPaint.tsx");
    const middleware = readSource("lib/supabase/middleware.ts");
    const pathnameHeader = readSource("lib/auth/request-pathname.ts");

    expect(pathnameHeader).toContain("x-rovexo-pathname");
    expect(middleware).toContain("ROVEXO_PATHNAME_HEADER");
    expect(middleware).toContain("nextWithPathname");
    expect(rootLoading).toContain("SplashFirstPaint");
    expect(rootLoading).toContain("isAuthBootPath");
    expect(rootLoading).toContain("ROVEXO_PATHNAME_HEADER");
    expect(splashLoading).toContain("SplashFirstPaint");
    expect(authLoading).toContain("SplashFirstPaint");
    expect(firstPaint).toContain("auth-splash--ssr");
    expect(firstPaint).toContain("BUY . SELL . GROW.");
    expect(firstPaint).toContain("/icons/icon-192.png");
  });
});
