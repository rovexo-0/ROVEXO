import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Platform — marketplace footer removed", () => {
  it("does not ship the global marketing footer component", () => {
    expect(existsSync(join(process.cwd(), "components/Footer.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "components/layout/ConditionalSiteFooter.tsx"))).toBe(false);
  });

  it("does not ship HelpPageFooter or NeedHelpLink", () => {
    expect(existsSync(join(process.cwd(), "features/help/components/HelpPageFooter.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "features/help/components/NeedHelpLink.tsx"))).toBe(false);
  });

  it("does not render a site footer from AppShellLayout", () => {
    const shell = readSource("components/layout/AppShellLayout.tsx");
    expect(shell).not.toContain("ConditionalSiteFooter");
    expect(shell).not.toContain("Footer");
  });

  it("does not import HelpPageFooter in app pages", () => {
    const paths = [
      "features/seller/dashboard/components/SellerDashboardPage.tsx",
      "features/business/dashboard/components/BusinessDashboardPage.tsx",
      "features/orders/components/OrdersListPage.tsx",
      "features/sell/components/SellPage.tsx",
    ];

    for (const path of paths) {
      const source = readSource(path);
      expect(source).not.toContain("HelpPageFooter");
    }
  });
});

describe("Sell draft persistence", () => {
  it("stores draft photos in IndexedDB", () => {
    const source = readSource("lib/sell/draft-photo-storage.ts");
    expect(source).toContain("indexedDB.open");
    expect(source).toContain("saveDraftPhotos");
    expect(source).toContain("loadDraftPhotos");
  });

  it("persists upload session id with draft autosave", () => {
    const storage = readSource("lib/sell/draft-storage.ts");
    const persist = readSource("lib/sell/persist-sell-draft.ts");
    expect(storage).toContain("saveUploadSessionId");
    expect(persist).toContain("saveDraftPhotos");
  });
});
