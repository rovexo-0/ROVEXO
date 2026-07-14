import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const CANONICAL_HEADER_EXPORT = "CanonicalPageHeader";

const LEGACY_HEADER_PATTERNS = [
  /className="rx-page-header sticky top-0 z-50"/,
  /wallet-hub__header/,
  /msg-v1__titlebar/,
  /chat-v1__header/,
];

const WRAPPER_FILES = [
  "components/beta/BetaPageHeader.tsx",
  "features/wallet/components/WalletHeader.tsx",
];

const CANONICAL_HEADER_CONSUMERS = [
  "features/messages/components/ChatPage.tsx",
  "features/product-detail/ProductDetailPage.tsx",
];

describe("CanonicalPageHeader platform standard", () => {
  it("exports the single canonical page header component", () => {
    const source = readSource("components/navigation/CanonicalPageHeader.tsx");
    expect(source).toContain('data-canonical-page-header="v1"');
    expect(source).toContain("preferHistory");
    expect(source).toContain("grid-cols-[48px_1fr_48px]");
  });

  it("uses router.back with listing-aware fallback in usePageBack", () => {
    const source = readSource("hooks/navigation/usePageBack.ts");
    expect(source).toContain("router.back()");
    expect(source).toContain("resolveListingBackFallback");
    expect(source).toContain("readPreviousNavigationPath");
    expect(source).toContain("visitDepth > 1");
  });

  it("routes legacy wrappers through CanonicalPageHeader", () => {
    for (const file of WRAPPER_FILES) {
      const source = readSource(file);
      expect(source).toContain(CANONICAL_HEADER_EXPORT);
    }
  });

  it("wires key internal surfaces to CanonicalPageHeader or AccountCanonicalShell", () => {
    for (const file of CANONICAL_HEADER_CONSUMERS) {
      const source = readSource(file);
      expect(source).toContain(CANONICAL_HEADER_EXPORT);
    }
    expect(readSource("features/wallet/components/WalletHubV1.tsx")).toContain("AccountCanonicalShell");
    for (const file of [
      "features/help/components/HelpFaqPage.tsx",
      "features/help/components/HelpPoliciesPage.tsx",
      "features/help/components/HelpArticlePage.tsx",
      "features/help/components/DecisionTreeWizard.tsx",
    ]) {
      expect(readSource(file)).toContain("AccountCanonicalShell");
    }
  });

  it("routes account-linked help index through AccountCanonicalShell", () => {
    const page = readSource("features/help/components/HelpCentrePage.tsx");
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain("CanonicalSection");
  });

  it("keeps product detail on the canonical header", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    expect(page).toContain(CANONICAL_HEADER_EXPORT);
  });

  it("discourages new inline rx-page-header shells on migrated routes", () => {
    const migrated = [
      "features/wallet/components/WalletHubV1.tsx",
      "features/inbox/components/InboxPage.tsx",
      "features/messages/components/ChatPage.tsx",
    ];

    for (const file of migrated) {
      const source = readSource(file);
      for (const pattern of LEGACY_HEADER_PATTERNS) {
        expect(pattern.test(source), `${file} must not use legacy header markup`).toBe(false);
      }
    }
  });
});
