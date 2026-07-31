import { describe, expect, it } from "vitest";
import { buildSettingsMenuSections } from "@/lib/account-center/settings-menu";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import { ACCOUNT_MENU_TITLES } from "@/lib/account/freeze";
import {
  SETTINGS_MENU_ROW_TITLES,
  SETTINGS_SECTION_TITLES,
} from "@/lib/settings/freeze";
import { PHASE_C3_SETTINGS_IA_V1 } from "@/lib/settings/phase-c3-settings-information-architecture-v1";
import { getAllHelpArticles } from "@/lib/help/content/articles";
import { searchHelpCentre } from "@/lib/help/search";
import type { UserProfile } from "@/lib/profile/types";

const stubProfile = { id: "u1" } as UserProfile;

describe("Phase C.3 — Settings Information Architecture", () => {
  it("makes Settings the Account Control Centre with Phase C.3 sections", () => {
    expect(PHASE_C3_SETTINGS_IA_V1.role).toBe("ACCOUNT_CONTROL_CENTRE");
    expect(PHASE_C3_SETTINGS_IA_V1.lastUpdated).toBe("30 July 2026");
    const sections = buildSettingsMenuSections(null);
    expect(sections.map((s) => s.title)).toEqual([...SETTINGS_SECTION_TITLES]);
    expect(sections.flatMap((s) => s.rows.map((r) => r.title))).toEqual([
      ...SETTINGS_MENU_ROW_TITLES,
    ]);
    expect(sections.some((s) => s.rows.some((r) => r.title === "Help Centre"))).toBe(true);
    expect(sections.some((s) => s.rows.some((r) => r.title === "Legal Information"))).toBe(true);
  });

  it("removes Help and Legal from Profile menu (single entry via Settings)", () => {
    expect(ACCOUNT_MENU_TITLES).not.toContain("Help Centre");
    expect(ACCOUNT_MENU_TITLES).not.toContain("Legal Information");
    expect(ACCOUNT_MENU_TITLES).toContain("Settings");
    expect(ACCOUNT_MENU_TITLES).toContain("Rovexo Ideas");
    const titles = buildAccountMenuSections(stubProfile, { activeListingCount: 0 }).flatMap((s) =>
      s.items.map((i) => i.title),
    );
    expect(titles).not.toContain("Help Centre");
    expect(titles).not.toContain("Legal Information");
    expect(PHASE_C3_SETTINGS_IA_V1.profileMenuRemoves).toEqual([
      "Help Centre",
      "Legal Information",
    ]);
  });

  it("updates Help articles with Last Updated 30 July 2026 and professional structure", () => {
    const articles = getAllHelpArticles();
    expect(articles.length).toBeGreaterThan(5);
    for (const article of articles.slice(0, 8)) {
      expect(article.lastUpdated).toBe("30 July 2026");
      expect(article.content).toMatch(/##\s*Purpose/i);
      expect(article.content).toMatch(/##\s*Frequently Asked Questions/i);
      expect(article.content).toMatch(/##\s*Related Articles/i);
      expect(article.content).toContain("30 July 2026");
    }
  });

  it("searches Help across articles and legal documents", () => {
    const results = searchHelpCentre("privacy policy", 20);
    expect(results.some((r) => r.href.includes("/legal/privacy-policy") || r.title.toLowerCase().includes("privacy"))).toBe(
      true,
    );
    const settings = searchHelpCentre("settings", 10);
    expect(settings.some((r) => r.href.includes("/account/settings"))).toBe(true);
  });
});
