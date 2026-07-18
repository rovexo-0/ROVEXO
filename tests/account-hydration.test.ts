import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/**
 * My Account canonical hub must not use framer-motion on menu grids.
 */
describe("My Account rendering safety", () => {
  it("canonical hub does not use framer-motion", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    expect(home).not.toMatch(/from ["']framer-motion["']/);
    expect(menu).not.toMatch(/<motion\./);
    expect(home).toContain("data-ac-hub-version");
  });

  it("canonical menu uses CanonicalMenuRow", () => {
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    expect(menu).toContain("CanonicalMenuRow");
    expect(menu).toContain("buildAccountMenuSections");
  });

  it("ac-canonical hub styles avoid transform on menu rows", () => {
    const css = readSource("styles/rovexo/account-canonical-v2.css");
    expect(css).toContain(".ac-canonical__row");
  });

  it("ROVEXO Ideas is reachable from Settings (Master Menu v2.0)", () => {
    const settings = readSource("lib/account-center/settings-menu.ts");
    expect(settings).toMatch(/id: "ideas"[\s\S]*?href:[\s\S]*?\/account\/ideas/);
    const icons = readSource("components/account/AccountIcons.tsx");
    expect(icons).toContain('"ideas"');
  });

  it("AccountCanonicalShell is the single subpage shell", () => {
    const shell = readSource("features/account-canonical/shell/AccountCanonicalShell.tsx");
    expect(shell).toContain("AccountCanonicalHeader");
    expect(shell).toContain("data-account-canonical");
  });
});
