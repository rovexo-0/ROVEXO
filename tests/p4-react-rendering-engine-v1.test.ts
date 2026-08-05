import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/**
 * P4 — React Rendering Engine contracts.
 * Locks measurable render-isolation patterns (no blind memo sprawl).
 */
describe("P4 React Rendering Engine v1", () => {
  it("isolates ToastProvider children from toast list state", () => {
    const toast = readSource("components/ui/Toast.tsx");
    expect(toast).toContain("ToastTree");
    expect(toast).toContain("memo(function ToastTree");
    expect(toast).toContain("<ToastTree>{children}</ToastTree>");
    expect(toast).toContain("ToastViewport");
  });

  it("bails RealtimeNotificationProvider applyState on identical badges", () => {
    const provider = readSource(
      "features/notifications/components/RealtimeNotificationProvider.tsx",
    );
    expect(provider).toContain("prev.messages === next.messages");
    expect(provider).toContain('prev["wallet-payout"] === next["wallet-payout"]');
    expect(provider).toContain("return prev");
  });

  it("keeps SearchResultCard memo effective via stable hover props", () => {
    const card = readSource("features/search/components/SearchResultCard.tsx");
    const products = readSource("features/search/components/ProductResults.tsx");
    const suggestions = readSource("features/search/components/SearchSuggestionList.tsx");

    expect(card).toContain("onHoverIndex?");
    expect(card).toContain("hoverNavIndex?");
    expect(card).not.toMatch(/onHover\?:/);
    expect(products).toContain("hoverNavIndex={navIndex}");
    expect(products).toContain("onHoverIndex={onHoverIndex}");
    expect(products).not.toContain("onHover={() =>");
    expect(suggestions).toContain("hoverNavIndex={currentIndex}");
    expect(suggestions).not.toContain("onHover={() =>");
  });

  it("memoises HomepageSearchField and isolates header scroll chrome", () => {
    const field = readSource("components/home/HomepageSearchField.tsx");
    const header = readSource("components/header/RovexoHeaderV2.tsx");

    expect(field).toContain("memo(function HomepageSearchField");
    expect(header).toContain("HeaderScrollShell");
    expect(header).toContain("isScrolled");
    // Scroll state must live in the shell — not the outer header that creates search JSX.
    expect(header).toMatch(/function HeaderScrollShell/);
    const shellStart = header.indexOf("function HeaderScrollShell");
    const outerStart = header.indexOf("function RovexoHeaderV2");
    expect(shellStart).toBeGreaterThan(-1);
    expect(outerStart).toBeGreaterThan(shellStart);
    const shellBlock = header.slice(shellStart, outerStart);
    expect(shellBlock).toContain("useState(false)");
    expect(shellBlock).toContain("isScrolled");
    const outerBlock = header.slice(outerStart);
    expect(outerBlock).not.toContain("setIsScrolled");
  });

  it("uses stable empty reservedIds defaults on marketplace feeds", () => {
    const canonical = readSource(
      "components/homepage/canonical/CanonicalMarketplaceFeed.tsx",
    );
    const v4 = readSource("components/homepage-v4/HomepageV4Feed.tsx");
    expect(canonical).toContain("EMPTY_RESERVED_IDS");
    expect(canonical).toContain("reservedIds = EMPTY_RESERVED_IDS");
    expect(canonical).not.toMatch(/reservedIds = \[\]/);
    expect(v4).toContain("EMPTY_RESERVED_IDS");
    expect(v4).toContain("reservedIds = EMPTY_RESERVED_IDS");
    expect(v4).not.toMatch(/reservedIds = \[\]/);
  });
});
