import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("sell scroll v1", () => {
  it("does not trap sell main content in a flex scroll container", () => {
    const source = readSource("features/sell/ui/SellScreen.tsx");
    expect(source).not.toContain("min-h-0 flex-1 flex-col");
    expect(source).toContain("sell-page-v1-shell");
    expect(source).toContain("clearBodyScrollLock");
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

  it("uses dynamic bottom clearance for publish bar", () => {
    const screen = readSource("features/sell/ui/SellScreen.tsx");
    expect(screen).toContain("useSellPageBottomClearance");
    expect(screen).toContain("sell-page-v1-content");
    expect(screen).not.toContain("pb-[calc(5.5rem");

    const css = readSource("styles/rovexo/sell.css");
    expect(css).toContain("--sell-content-bottom-padding");
    expect(css).toContain("--sell-publish-bar-measured");
    expect(css).toContain("--sell-keyboard-offset");

    const hook = readSource("features/sell/hooks/use-sell-page-bottom-clearance.ts");
    expect(hook).toContain("ResizeObserver");
    expect(hook).toContain("visualViewport");
  });
});
