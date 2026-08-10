import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canAutosaveDatabaseDraft,
  canPersistDatabaseDraft,
  DRAFT_DATABASE_SAVED_MESSAGE,
  DRAFT_DATABASE_SSOT_V1,
  PUBLISH_FAILURE_NO_DRAFT_MESSAGE,
} from "@/lib/sell/draft-database-ssot-v1";
import { PUBLISH_FAILURE_MESSAGE } from "@/lib/sell/publish-engine";

describe("draft-database-ssot-v1", () => {
  it("locks Draft SSOT to products.status=draft API", () => {
    expect(DRAFT_DATABASE_SSOT_V1.status).toBe("draft");
    expect(DRAFT_DATABASE_SSOT_V1.apiPath).toBe("/api/sell/draft");
  });

  it("requires uploaded photos before database draft persist", () => {
    expect(canPersistDatabaseDraft({ photos: [] })).toBe(false);
    expect(
      canPersistDatabaseDraft({
        photos: [{ uploaded: true, url: "https://x/a.jpg", storagePath: "a.jpg" }],
      }),
    ).toBe(true);
  });

  it("skips database autosave without a persistable price (P10.1 post-publish empty)", () => {
    const photos = [{ uploaded: true, url: "https://x/a.jpg", storagePath: "a.jpg" }];
    expect(canAutosaveDatabaseDraft({ photos, price: "" })).toBe(false);
    expect(canAutosaveDatabaseDraft({ photos, price: "0" })).toBe(false);
    expect(canAutosaveDatabaseDraft({ photos, price: "0.01" })).toBe(true);
    expect(canAutosaveDatabaseDraft({ photos: [], price: "12.00" })).toBe(false);
  });

  it("claims draft saved only via DB success message; publish fallback never fakes it", () => {
    expect(DRAFT_DATABASE_SAVED_MESSAGE).toContain("draft has been safely saved");
    expect(PUBLISH_FAILURE_NO_DRAFT_MESSAGE).not.toContain("safely saved");
    expect(PUBLISH_FAILURE_MESSAGE).not.toContain("safely saved");
  });

  it("wires Sell Publish bottom clearance to Account bottom-nav offset (inline Publish)", () => {
    const css = readFileSync(join(process.cwd(), "styles/rovexo/sell.css"), "utf8");
    expect(css).toContain("var(--cds-bottom-nav-offset");
    expect(css).not.toMatch(/\[data-sell-publish-bar\][\s\S]{0,120}bottom:\s*0;/);
    expect(css).toMatch(/\[data-sell-publish-bar\][\s\S]{0,200}position:\s*static/);
  });

  it("exposes Sell balanced premium typography tokens", () => {
    const css = readFileSync(join(process.cwd(), "styles/rovexo/sell.css"), "utf8");
    // Compact Premium Sell (inherits Account density) — live token values.
    expect(css).toContain("--sell-font-page-title: 17px");
    expect(css).toContain("--sell-font-section: 15px");
    expect(css).toContain("--sell-font-label: 14px");
    expect(css).toContain("--sell-font-control: 16px");
    expect(css).toContain("--sell-font-description: 16px");
    expect(css).toContain("--sell-font-helper: 13px");
  });
});
