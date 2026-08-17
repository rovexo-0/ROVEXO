/**
 * OPT-P0-CSS-03 — Auth CSS isolation from Homepage / platform megabundle.
 * Import ownership only — selectors untouched; Auth UI unchanged.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

/** Live Auth routes under app/(auth)/ — must inherit auth-entry → auth-v1. */
const LIVE_AUTH_ROUTE_PAGES = [
  "app/(auth)/login/page.tsx",
  "app/(auth)/login/mfa/page.tsx",
  "app/(auth)/register/page.tsx",
  "app/(auth)/forgot-password/page.tsx",
  "app/(auth)/reset-password/page.tsx",
  "app/(auth)/verify-email/page.tsx",
  "app/(auth)/splash/page.tsx",
  "app/(auth)/welcome/page.tsx",
] as const;

const PROTECTED_IMPORT_ANCHORS = [
  "tokens.css",
  "typography.css",
  "shell.css",
  "layout.css",
  "mobile-scroll-v1.css",
  "bottom-nav-premium.css",
  "full-width-engine-v1.css",
  "phone-width-v1-freeze.css",
  "listing-card-official.css",
  "store-listing-card-premium-v1.css",
  "category-rail.css",
  "primary-button-v1.css",
  "platform-canonical-ui.css",
  "canonical-ds.css",
] as const;

describe("OPT-P0-CSS-03 Auth CSS isolation", () => {
  it("1: auth-v1.css is NOT imported by styles/rovexo/index.css", () => {
    const index = readSource("styles/rovexo/index.css");
    expect(index).not.toContain('@import "./auth-v1.css"');
    expect(index).toContain("OPT-P0-CSS-03");
  });

  it("2: canonical Auth owner is app/(auth)/layout → auth-entry.css → auth-v1.css", () => {
    const authLayout = readSource("app/(auth)/layout.tsx");
    const authEntry = readSource("styles/rovexo/auth-entry.css");
    expect(authLayout).toContain('import "@/styles/rovexo/auth-entry.css"');
    expect(authEntry).toContain('@import "./auth-v1.css"');
    expect(existsSync(join(process.cwd(), "styles/rovexo/auth-v1.css"))).toBe(true);
  });

  it("3: live Auth route pages exist under the Auth layout group", () => {
    for (const page of LIVE_AUTH_ROUTE_PAGES) {
      expect(existsSync(join(process.cwd(), page)), page).toBe(true);
    }
  });

  it("4: Homepage platform entry does not load auth-v1; platform layout still uses index.css", () => {
    const platformLayout = readSource("app/(platform)/layout.tsx");
    const index = readSource("styles/rovexo/index.css");
    expect(platformLayout).toContain("@/styles/rovexo/index.css");
    expect(platformLayout).not.toContain("auth-v1.css");
    expect(platformLayout).not.toContain("auth-entry.css");
    expect(index).not.toContain('@import "./auth-v1.css"');
  });

  it("5: no duplicate Auth CSS owner files (one auth-entry, one auth-v1 asset)", () => {
    expect(existsSync(join(process.cwd(), "styles/rovexo/auth-entry.css"))).toBe(true);
    expect(existsSync(join(process.cwd(), "styles/rovexo/auth-v1.css"))).toBe(true);
    /* Only one layout imports auth-entry as the Auth group SSOT. */
    const authLayout = readSource("app/(auth)/layout.tsx");
    expect(authLayout.match(/auth-entry\.css/g)?.length).toBe(1);
    /* auth-entry imports auth-v1 exactly once. */
    const authEntry = readSource("styles/rovexo/auth-entry.css");
    expect(authEntry.match(/@import "\.\/auth-v1\.css"/g)?.length).toBe(1);
  });

  it("6: protected Homepage CSS imports remain in index.css", () => {
    const index = readSource("styles/rovexo/index.css");
    for (const sheet of PROTECTED_IMPORT_ANCHORS) {
      expect(index, sheet).toContain(sheet);
    }
  });

  it("7: platform Auth UI consumer loads auth-v1 (Account security reset via email)", () => {
    const page = readSource("features/account/components/AccountSecurityResetViaEmailPage.tsx");
    expect(page).toContain('import "@/styles/rovexo/auth-v1.css"');
    expect(page).toContain("AuthIconInput");
  });

  it("8: auth-v1.css selectors are not edited by this isolation task", () => {
    const css = readSource("styles/rovexo/auth-v1.css");
    expect(css).not.toContain("OPT-P0-CSS-03");
    expect(css).toContain(".auth-login");
    expect(css).toContain(".auth-register");
    expect(css).toContain(".auth-icon-field");
  });
});
