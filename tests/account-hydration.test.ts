import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/**
 * My Account must not use framer-motion on the grid or cards. Applying motion
 * transforms to CSS Grid containers breaks Android Chrome compositing and
 * produces duplicated cards, overlapping labels, and corrupted statistics.
 */
describe("My Account rendering safety", () => {
  it("MyAccountGrid does not use framer-motion", () => {
    const source = readSource("components/account/MyAccountGrid.tsx");
    expect(source).not.toMatch(/from ["']framer-motion["']/);
    expect(source).not.toMatch(/<motion\./);
    expect(source).toContain('className="acx-grid"');
  });

  it("MyAccountCard does not use framer-motion", () => {
    const source = readSource("components/account/MyAccountCard.tsx");
    expect(source).not.toMatch(/from ["']framer-motion["']/);
    expect(source).not.toMatch(/<motion\./);
  });

  it("acx-grid avoids grid-auto-rows: 1fr (Android grid compositor bug)", () => {
    const css = readSource("styles/rovexo/account-2026.css");
    const gridBlock = css.slice(css.indexOf(".acx-grid {"), css.indexOf(".acx-card-motion"));
    expect(gridBlock).not.toContain("grid-auto-rows");
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
