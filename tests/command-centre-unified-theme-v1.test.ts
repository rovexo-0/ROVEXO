import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COMMAND_CENTRE_UNIFIED_THEME_V1,
  parseCommandCentreAppearance,
  resolveCommandCentreHomeHref,
  resolveCommandCentreTitle,
} from "@/lib/command-centre/command-centre-unified-theme-v1";
import { ADMIN_COMMAND_CENTRE_NAV } from "@/lib/command-centre/admin-command-centre-nav-v1";
import { COMMAND_CENTER_SIDEBAR_NAV } from "@/lib/super-admin/nav";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Command Centre Unified White Theme RC1", () => {
  it("defaults to white theme and supports dark", () => {
    expect(COMMAND_CENTRE_UNIFIED_THEME_V1.defaultAppearance).toBe("light");
    expect(parseCommandCentreAppearance(null)).toBe("light");
    expect(parseCommandCentreAppearance("dark")).toBe("dark");
    expect(parseCommandCentreAppearance("light")).toBe("light");
  });

  it("keeps role titles and home routes distinct", () => {
    expect(resolveCommandCentreTitle("admin")).toBe("Admin Command Centre");
    expect(resolveCommandCentreTitle("super_admin")).toBe("Super Admin Command Centre");
    expect(resolveCommandCentreHomeHref("admin")).toBe("/admin");
    expect(resolveCommandCentreHomeHref("super_admin")).toBe("/super-admin");
  });

  it("keeps Admin and Super Admin module lists separate (no UI duplication of permissions)", () => {
    expect(ADMIN_COMMAND_CENTRE_NAV.some((item) => item.href.startsWith("/admin"))).toBe(true);
    expect(ADMIN_COMMAND_CENTRE_NAV.every((item) => !item.href.startsWith("/super-admin"))).toBe(
      true,
    );
    expect(ADMIN_COMMAND_CENTRE_NAV.every((item) => item.href !== "/admin/categories")).toBe(true);
    expect(COMMAND_CENTER_SIDEBAR_NAV.every((item) => item.href.startsWith("/super-admin"))).toBe(
      true,
    );
  });

  it("wires one shared CommandCentreLayout into both shells", () => {
    const layout = readSource("features/command-centre/CommandCentreLayout.tsx");
    const adminShell = readSource("features/command-centre/AdminCommandCentreShell.tsx");
    const superShell = readSource("features/super-admin/components/SuperAdminShell.tsx");
    const adminLayout = readSource("app/(platform)/admin/layout.tsx");
    const superLayout = readSource("app/(platform)/super-admin/layout.tsx");
    const adminCategories = readSource("app/(platform)/admin/categories/page.tsx");
    const css = readSource("styles/rovexo/command-centre-unified-v1.css");

    expect(layout).toContain("data-command-centre=\"unified-v1\"");
    expect(layout).toContain("data-cc-appearance");
    expect(layout).toContain("useSuperAdminCommandPalette(enableSuperAdminTools)");
    expect(layout).toContain("cc-unified__backdrop");
    expect(adminShell).toContain("CommandCentreLayout");
    expect(adminShell).toContain('variant="admin"');
    expect(superShell).toContain("CommandCentreLayout");
    expect(superShell).toContain('variant="super_admin"');
    expect(adminLayout).toContain("AdminCommandCentreShell");
    expect(adminLayout).toContain('requireRole(["admin", "super_admin"])');
    expect(superLayout).toContain("SuperAdminShell");
    expect(superLayout).toContain('requireRole(["super_admin"])');
    expect(adminCategories).toContain('redirect("/super-admin/category-management")');
    expect(adminCategories).toContain("isSuperAdmin");
    expect(adminCategories).toContain("data-admin-categories=\"restricted\"");
    expect(css).toContain('[data-cc-appearance="light"]');
    expect(css).toContain('[data-cc-appearance="dark"]');
    expect(css).toContain("min-height: 44px");
  });
});