import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ROVEXO_IDEAS_DOM,
  ROVEXO_IDEAS_FORBIDDEN_NAMES,
  ROVEXO_IDEAS_ICON,
  ROVEXO_IDEAS_MENU_TITLE,
  ROVEXO_IDEAS_PROFILE_MENU_ORDER,
  ROVEXO_IDEAS_ROUTE,
  ROVEXO_IDEAS_USER_MAY,
  rovexoIdeasV1Snapshot,
} from "@/lib/rovexo-ideas/rovexo-ideas-v1-lock";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Rovexo Ideas FINAL IMPLEMENTATION LOCK v1.0", () => {
  it("locks official name and Profile inheritance contract", () => {
    const snap = rovexoIdeasV1Snapshot();
    expect(snap.name).toBe("Rovexo Ideas");
    expect(snap.status).toBe("PERMANENTLY LOCKED");
    expect(snap.route).toBe(ROVEXO_IDEAS_ROUTE);
    expect(ROVEXO_IDEAS_MENU_TITLE).toBe("Rovexo Ideas");
    expect(ROVEXO_IDEAS_FORBIDDEN_NAMES).toContain("ROVEXO Ideas");
    expect(snap.menuOrder).toEqual([...ROVEXO_IDEAS_PROFILE_MENU_ORDER]);
    expect(snap.userMay).toEqual([...ROVEXO_IDEAS_USER_MAY]);
    expect(ROVEXO_IDEAS_ICON.sizePx).toBe(24);
    expect(ROVEXO_IDEAS_ICON.color).toBe("#FFD54A");
    expect(ROVEXO_IDEAS_ICON.forbidden).toContain("gradient");
    expect(ROVEXO_IDEAS_ICON.forbidden).toContain("emoji");
  });

  it("places Rovexo Ideas on Profile between Settings and Help Centre", () => {
    const menu = readSource("lib/account-center/canonical-menu.ts");
    const settingsIdx = menu.indexOf('title: "Settings"');
    const ideasIdx = menu.indexOf(`title: "${ROVEXO_IDEAS_MENU_TITLE}"`);
    const helpIdx = menu.indexOf('title: "Help Centre"');
    const legalIdx = menu.indexOf('title: "Legal Information"');

    expect(ideasIdx).toBeGreaterThan(settingsIdx);
    expect(helpIdx).toBeGreaterThan(ideasIdx);
    expect(legalIdx).toBeGreaterThan(helpIdx);
    expect(menu).toContain(`href: "${ROVEXO_IDEAS_ROUTE}"`);
    expect(menu).toContain('icon: "ideas"');
    expect(menu).not.toContain('title: "ROVEXO Ideas"');
  });

  it("does not duplicate Ideas in Settings menu", () => {
    const settings = readSource("lib/account-center/settings-menu.ts");
    expect(settings).not.toContain('title: "Rovexo Ideas"');
    expect(settings).not.toContain('title: "ROVEXO Ideas"');
    expect(settings).not.toContain("/account/ideas");
  });

  it("uses Profile-identical row with golden lightbulb icon (no custom Ideas CSS)", () => {
    const sections = readSource("features/account-center/components/AccountMenuSections.tsx");
    const icons = readSource("features/account-center/components/ProfileMenuIcons.tsx");
    const colors = readSource("lib/account-center/profile-icon-system-v1.ts");
    const css = readSource("styles/rovexo/account-canonical-v2.css");

    expect(sections).toContain("ProfileMenuIcon");
    expect(icons).toContain("function Lightbulb");
    expect(colors).toContain('ideas: "#FFD54A"');
    expect(sections).not.toContain("ac-canonical__menu-row--ideas");
    expect(css).not.toContain("ac-canonical__menu-row--ideas");
    expect(css).not.toContain("ac-canonical__ideas-icon");
  });

  it("inherits MyAccountTemplate and stamps v1 DOM", () => {
    const page = readSource("features/account-module/components/RovexoIdeasPage.tsx");
    const route = readSource("app/account/ideas/page.tsx");

    expect(route).toContain("RovexoIdeasPage");
    expect(route).toContain("Rovexo Ideas");
    expect(route).not.toContain('title: "ROVEXO Ideas');
    expect(page).toContain("MyAccountTemplate");
    expect(page).toContain(`data-rovexo-ideas-version={ROVEXO_IDEAS_DOM}`);
    expect(page).toContain("Submit Idea");
    expect(page).not.toContain("CanonicalCard");
    expect(ROVEXO_IDEAS_DOM).toBe("v1.0-ideas-lock");
  });

  it("keeps super-admin review module", () => {
    const admin = readSource("features/super-admin/rovexo-ideas/RovexoIdeasAdmin.tsx");
    const nav = readSource("lib/super-admin/nav.ts");
    expect(admin).toContain("Rovexo Ideas");
    expect(nav).toContain("/super-admin/rovexo-ideas");
    expect(nav).toContain("Rovexo Ideas");
  });
});
