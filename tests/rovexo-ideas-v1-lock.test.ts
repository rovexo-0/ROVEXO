import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ROVEXO_IDEAS_DOM,
  ROVEXO_IDEAS_EMPTY_COPY,
  ROVEXO_IDEAS_FORBIDDEN_NAMES,
  ROVEXO_IDEAS_HERO,
  ROVEXO_IDEAS_ICON,
  ROVEXO_IDEAS_MENU_TITLE,
  ROVEXO_IDEAS_PROFILE_MENU_ORDER,
  ROVEXO_IDEAS_ROUTE,
  ROVEXO_IDEAS_SHARE_CTA,
  ROVEXO_IDEAS_USER_MAY,
  rovexoIdeasV1Snapshot,
} from "@/lib/rovexo-ideas/rovexo-ideas-v1-lock";
import { communityApprovalPercent } from "@/lib/rovexo-ideas/types";

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
    expect(ROVEXO_IDEAS_SHARE_CTA).toBe("Share Your Idea");
    expect(ROVEXO_IDEAS_EMPTY_COPY.title).toContain("waiting for your ideas");
  });

  it("places Rovexo Ideas on Profile after Settings", () => {
    const menu = readSource("lib/account-center/canonical-menu.ts");
    const settingsIdx = menu.indexOf('title: "Settings"');
    const ideasIdx = menu.indexOf('title: "Rovexo Ideas"');
    expect(settingsIdx).toBeGreaterThan(-1);
    expect(ideasIdx).toBeGreaterThan(settingsIdx);
  });

  it("does not duplicate Ideas in Settings menu", () => {
    const settings = readSource("lib/account-center/settings-menu.ts");
    expect(settings).not.toContain('title: "Rovexo Ideas"');
    expect(settings).not.toContain("/account/ideas");
  });

  it("keeps Profile menu row golden lightbulb (no custom menu-row CSS)", () => {
    const icons = readSource("features/account-center/components/ProfileMenuIcons.tsx");
    const colors = readSource("lib/account-center/profile-icon-system-v1.ts");
    const css = readSource("styles/rovexo/account-canonical-v2.css");
    expect(icons).toContain("function Lightbulb");
    expect(colors).toContain('ideas: "#FFD54A"');
    expect(css).not.toContain("ac-canonical__menu-row--ideas");
  });

  it("implements Owner community mockup on single page", () => {
    const page = readSource("features/account-module/components/RovexoIdeasPage.tsx");
    const route = readSource("app/(platform)/account/ideas/page.tsx");
    const css = readSource("styles/rovexo/rovexo-ideas-v1.css");
    const indexCss = readSource("styles/rovexo/index.css");

    expect(route).toContain("RovexoIdeasPage");
    expect(page).toContain("MyAccountTemplate");
    expect(page).toContain(`data-rovexo-ideas-version={ROVEXO_IDEAS_DOM}`);
    expect(page).toContain("isEmptyState");
    expect(page).toContain("isCommunityState");
    expect(page).toContain("hideBack");
    expect(page).toContain("rx-ideas__empty");
    expect(page).toContain("ROVEXO_IDEAS_SHARE_CTA");
    expect(page).not.toContain('"Submit Idea"');
    expect(ROVEXO_IDEAS_SHARE_CTA).toBe("Share Your Idea");
    expect(ROVEXO_IDEAS_EMPTY_COPY.title).toBe("Hmm... we're waiting for your ideas!");
    expect(page).toContain('import "@/styles/rovexo/rovexo-ideas-v1.css"');
    expect(css).toContain(".rx-ideas__hero");
    expect(css).toContain("rx-ideas__fade-in");
    expect(indexCss).not.toContain('@import "./rovexo-ideas-v1.css"');
    expect(ROVEXO_IDEAS_DOM).toBe("v1.0-ideas-community");
    expect(ROVEXO_IDEAS_HERO.bearSrc).toBe("/ideas/rx-bear-hero.png");
  });

  it("UI Lock: Empty State only when ideas.length === 0", () => {
    const page = readSource("features/account-module/components/RovexoIdeasPage.tsx");
    const lock = readSource("lib/rovexo-ideas/rovexo-ideas-v1-lock.ts");
    expect(lock).toContain("ROVEXO_IDEAS_EMPTY_HIDES");
    expect(lock).toContain('"search"');
    expect(lock).toContain('"idea-list"');
    expect(page).toContain("ideas.length === 0");
    expect(page).toContain("ideas.length > 0");
    expect(page).not.toContain("stats.submitted > 0 || ideas.length > 0");
    expect(page).toContain("isCommunityState ? (");
    expect(page).toContain("rx-ideas__search rx-ideas__fade-in");
    // Search is gated — not always mounted
    expect(page).toMatch(/isCommunityState \? \([\s\S]*rx-ideas__search/);
    // Empty unmounts when ideas exist (no duplicate empty+list)
    expect(page).toMatch(/isEmptyState \? \([\s\S]*rx-ideas__empty/);
    expect(page).toMatch(/isCommunityState \? \([\s\S]*rx-ideas__list/);
  });

  it("wires community APIs and migration", () => {
    const migration = readSource(
      "supabase/migrations/20260731123000_rovexo_ideas_community_v1.sql",
    );
    expect(migration).toContain("rovexo_idea_votes");
    expect(migration).toContain("rovexo_idea_comments");
    expect(migration).toContain("rovexo_idea_follows");
    expect(migration).toContain("rovexo_idea_updates");
    expect(readSource("app/api/account/ideas/[id]/vote/route.ts")).toContain("setIdeaVote");
    expect(readSource("app/api/account/ideas/[id]/follow/route.ts")).toContain("setIdeaFollow");
    expect(readSource("app/api/account/ideas/[id]/comments/route.ts")).toContain(
      "addIdeaComment",
    );
  });

  it("calculates community approval correctly", () => {
    expect(communityApprovalPercent(96, 4)).toBe(96);
    expect(communityApprovalPercent(0, 0)).toBe(0);
    expect(communityApprovalPercent(1, 1)).toBe(50);
  });

  it("keeps super-admin review module", () => {
    const admin = readSource("features/super-admin/rovexo-ideas/RovexoIdeasAdmin.tsx");
    const nav = readSource("lib/super-admin/nav.ts");
    expect(admin).toContain("Rovexo Ideas");
    expect(nav).toContain("/super-admin/rovexo-ideas");
  });
});
