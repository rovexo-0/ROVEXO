import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";
import { AUTH_ROUTES } from "@/lib/auth/canonical";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH_MASTER_SPEC v1.0 — canonical Welcome v2.0", () => {
  it("preserves canonical auth routes", () => {
    expect(AUTH_MASTER_SPEC_VERSION).toBe("v1.0");
    expect(AUTH_ROUTES.welcome).toBe("/welcome");
    expect(AUTH_MASTER_SPEC.welcome.presentation.background).toBe("#ffffff");
    expect(AUTH_MASTER_SPEC.welcome.routes.signIn).toBe("/login");
    expect(AUTH_MASTER_SPEC.welcome.routes.register).toBe("/register");
  });

  it("implements the singular canonical Welcome v2.0 release", () => {
    const page = readSource("app/(auth)/welcome/page.tsx");
    const screen = readSource("features/auth/components/WelcomeScreen.tsx");
    const layout = readSource("app/(auth)/welcome/layout.tsx");

    expect(page).toContain("WelcomeScreen");
    expect(page).toContain("redirectIfAuthenticated");
    expect(screen).toContain("RovexoWordmark");
    expect(screen).toContain('data-auth-ui="v2.0-official-release"');
    expect(screen).toContain('data-welcome-lock="CANONICAL-V2"');
    expect(screen).toContain("The open marketplace");
    expect(screen).toContain("for real value.");
    expect(screen).toContain("BUY <span>•</span> SELL <span>•</span> GROW.");
    expect(screen).toContain('href={routes.register}');
    expect(screen).toContain('href={routes.signIn}');
    expect(screen).not.toContain("SocialLogin");
    expect(layout).toContain("auth-welcome-route");
  });

  it("locks premium motion, reduced motion, and touch feedback", () => {
    const css = readSource("styles/rovexo/welcome-v2.css");
    expect(css).toContain("welcome-v2-float");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("background: #ffffff");
    expect(css).toContain("transform: scale(0.97)");
    expect(css).toContain("80ms cubic-bezier(0.2, 0.8, 0.2, 1)");
    expect(css).not.toMatch(/bounce/);
  });

  it("bypasses AuthShell on welcome route", () => {
    const routeLayout = readSource("components/auth/AuthRouteLayout.tsx");
    expect(routeLayout).toContain("AUTH_ROUTES.welcome");
  });

  it("supports facebook oauth in auth actions", () => {
    const actions = readSource("lib/auth/actions.ts");
    expect(actions).toContain('"facebook"');
  });
});
