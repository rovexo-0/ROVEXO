import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Bottom Navigation V2 — final lock", () => {
  it("uses v2 shell with five canonical destinations", () => {
    const nav = readSource("components/ui/BottomNavigation.tsx");
    const css = readSource("styles/rovexo/bottom-nav-premium.css");

    expect(nav).toContain('data-bottom-nav="v2"');
    expect(nav).toContain("BottomNavV2Icon");
    expect(nav).toContain('id: "search"');
    expect(nav).toContain('t("nav.search")');
    expect(css).toContain("--rx-bottom-nav-height: 50px");
    expect(css).toContain("#111111");
    expect(css).toContain("box-shadow: none");
    expect(css).toContain("border-top: 1px solid #e5e7eb");
  });

  it("uses slim shell clearance token", () => {
    const globals = readSource("app/globals.css");
    const compact = readSource("styles/rovexo/compact-premium-v1.css");
    // Compact Premium (PO 2026-07-18): 52px bar + safe area; FAB 56px
    expect(globals).toContain("--bottom-nav-shell-height: 52px");
    expect(compact).toContain("--cp-bottom-nav-height: 52px");
    expect(compact).toContain("--cp-fab-size: 56px");
  });

  it("uses outline profile icon — never avatar in bottom nav", () => {
    const nav = readSource("components/ui/BottomNavigation.tsx");
    expect(nav).not.toContain("Avatar");
    expect(nav).not.toContain("AccountNavLink");
    expect(nav).toContain("<NavLink item={account}");
  });
});
