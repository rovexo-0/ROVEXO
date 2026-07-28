import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("sell scroll v1", () => {
  it("uses Account shell document scroll — no SellScreen flex trap", () => {
    const source = readSource("features/sell/ui/SellPage.tsx");
    expect(source).toContain("AccountCanonicalShell");
    expect(source).toContain("AccountPageStack");
    expect(source).toContain("data-sell-shell");
    expect(source).toContain("clearBodyScrollLock");
    expect(source).toContain("useSellPageBottomClearance");
  });

  it("sell fullscreen pickers never lock document body", () => {
    const pickers = [
      "features/sell/ui/SellOptionPicker.tsx",
      "features/sell/ui/SellCategoryPicker.tsx",
      "features/sell/ui/SellParcelBlock.tsx",
      "features/sell/ui/SellPhotoRail.tsx",
    ];

    for (const file of pickers) {
      const source = readSource(file);
      expect(source, file).toContain("lockScroll={false}");
    }
  });

  it("fullscreen modals default to no body lock", () => {
    const source = readSource("components/ui/ModalContainer.tsx");
    expect(source).toContain('lockScroll = variant === "sheet" || variant === "centered"');
  });

  it("body scroll lock does not disable touch-action", () => {
    const css = readSource("styles/rovexo/mobile-scroll-v1.css");
    expect(css).not.toContain("touch-action: none");
  });

  it("uses sticky publish clearance tokens", () => {
    const css = readSource("styles/rovexo/sell.css");
    expect(css).toContain("--sell-sticky-clearance");
    expect(css).toContain("account-settings-sticky-action");

    const hook = readSource("features/sell/hooks/use-sell-page-bottom-clearance.ts");
    expect(hook).toContain("ResizeObserver");
  });
});
