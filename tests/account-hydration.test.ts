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
    expect(home).toContain("data-account-version");
  });

  it("canonical menu uses wallet-matched row list", () => {
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    expect(menu).toContain("ac-v1__row");
    expect(menu).toContain("buildAccountMenuSections");
    expect(menu).toContain('from "lucide-react"');
  });

  it("ac-v1 hub styles keep outline menu icons", () => {
    const css = readSource("styles/rovexo/account-canonical-v2.css");
    expect(css).toContain(".ac-v1__row-icon");
    expect(css).toContain("background: transparent");
  });

  it("ROVEXO Ideas remains a dedicated account route with icon support", () => {
    const ideasPage = readSource("app/account/ideas/page.tsx");
    expect(ideasPage.length).toBeGreaterThan(0);
    const icons = readSource("components/account/AccountIcons.tsx");
    expect(icons).toContain('"ideas"');
  });

  it("AccountCanonicalShell is the single subpage shell", () => {
    const shell = readSource("features/account-canonical/shell/AccountCanonicalShell.tsx");
    expect(shell).toContain("AccountCanonicalHeader");
    expect(shell).toContain("data-account-canonical");
  });
});
