import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/**
 * The My Account grid animates its cards with framer-motion. framer-motion's own
 * `useReducedMotion` reads the live media query on the client's first render while
 * the server assumes `false`, which produced a hydration mismatch on the motion
 * markup (animated `initial` opacity/transform + a `whileHover`/`whileTap`-derived
 * `tabindex`) for users who prefer reduced motion. These guards keep the fix in
 * place: the components must use the SSR-safe `usePrefersReducedMotion` hook.
 */
describe("My Account hydration safety", () => {
  it("exposes an SSR-safe reduced-motion hook via useSyncExternalStore", () => {
    const source = readSource("lib/motion/use-prefers-reduced-motion.ts");
    expect(source).toContain("useSyncExternalStore");
    expect(source).toContain("function getServerSnapshot(): boolean {");
    expect(source).toMatch(/getServerSnapshot[\s\S]*return false;/);
  });

  it("MyAccountGrid uses the SSR-safe hook, not framer-motion's useReducedMotion", () => {
    const source = readSource("components/account/MyAccountGrid.tsx");
    expect(source).toContain("usePrefersReducedMotion");
    expect(source).not.toContain("useReducedMotion");
  });

  it("MyAccountGrid gates Super Admin Command Center by role", () => {
    const grid = readSource("components/account/MyAccountGrid.tsx");
    const nav = readSource("components/account/account-nav.ts");
    expect(nav).toContain("SUPER_ADMIN_ACCOUNT_NAV_ITEM");
    expect(nav).toContain('href: "/super-admin"');
    expect(grid).toContain('role === "super_admin"');
    expect(grid).toContain("SUPER_ADMIN_ACCOUNT_NAV_ITEM");
  });
});
