import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { UI_POLISH_FOUNDATION_LOCK_V1 } from "@/lib/design-system/ui-polish-foundation-lock-v1";

describe("ROVEXO UI Polish Foundation Lock v1.0", () => {
  it("locks foundation status and forbids redesign / marketplace copies", () => {
    expect(UI_POLISH_FOUNDATION_LOCK_V1.status).toBe("LOCKED");
    expect(UI_POLISH_FOUNDATION_LOCK_V1.forbidden).toContain("redesign");
    expect(UI_POLISH_FOUNDATION_LOCK_V1.forbidden).toContain("copy_vinted");
    expect(UI_POLISH_FOUNDATION_LOCK_V1.forbidden).toContain("listing_card_redesign");
  });

  it("permanently locks Listing Card outside UI Elements polish", () => {
    expect(UI_POLISH_FOUNDATION_LOCK_V1.listingCard.status).toBe("PERMANENTLY_LOCKED");
    expect(UI_POLISH_FOUNDATION_LOCK_V1.listingCard.ssot).toBe("components/ui/ListingCard.tsx");
    expect(UI_POLISH_FOUNDATION_LOCK_V1.listingCard.excludedFromUiElementsPolish).toBe(true);
    expect(UI_POLISH_FOUNDATION_LOCK_V1.listingCard.allowed).toEqual([
      "bug_fixes",
      "accessibility",
      "performance",
    ]);
    expect(UI_POLISH_FOUNDATION_LOCK_V1.pillars.uiElements).not.toContain("listing_card");
  });

  it("requires one design system and mobile-first purple identity", () => {
    expect(UI_POLISH_FOUNDATION_LOCK_V1.globalRules).toContain("one_design_system");
    expect(UI_POLISH_FOUNDATION_LOCK_V1.globalRules).toContain("mobile_first");
    expect(UI_POLISH_FOUNDATION_LOCK_V1.globalRules).toContain("rovexo_purple_primary_accent");
    expect(UI_POLISH_FOUNDATION_LOCK_V1.globalRules).toContain("preserve_existing_visual_identity");
  });

  it("ships Cursor foundation rule aligned to SSOT", () => {
    const rule = readFileSync(
      join(process.cwd(), ".cursor/rules/ui-polish-foundation-lock-v1.mdc"),
      "utf8",
    );
    expect(rule).toContain("ui-polish-foundation-lock-v1.ts");
    expect(rule).toContain("Listing Card");
    expect(rule).toContain("permanently locked");
  });
});
