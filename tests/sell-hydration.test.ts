import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Sell module hydration safety", () => {
  it("does not read localStorage during SellProvider initial state", () => {
    const source = readSource("features/sell/context/SellProvider.tsx");
    const initializer = source.slice(
      source.indexOf("useState<SellListingDraft>"),
      source.indexOf("const [formError"),
    );

    expect(initializer).not.toContain("loadSellDraft()");
  });

  it("restores sell draft only inside useEffect after mount", () => {
    const source = readSource("features/sell/context/SellProvider.tsx");
    expect(source).toContain("useEffect(() => {");
    expect(source).toContain("const stored = loadSellDraft();");
  });

  it("does not call crypto.randomUUID during render in SellProvider", () => {
    const source = readSource("features/sell/context/SellProvider.tsx");
    expect(source).not.toMatch(/useRef\(crypto\.randomUUID\(\)\)/);
  });

  it("keeps ListingForm free of browser APIs during render", () => {
    const source = readSource("features/sell/components/ListingForm.tsx");
    expect(source).not.toContain("window.");
    expect(source).not.toContain("document.");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
    expect(source).not.toContain("navigator.");
    expect(source).not.toContain("Date.now()");
    expect(source).not.toContain("Math.random()");
    expect(source).not.toContain("crypto.randomUUID()");
    expect(source).not.toContain("scrollIntoView");
  });

  it("persists draft from pending refs without flushing text commits during autosave", () => {
    const source = readSource("lib/sell/persist-sell-draft.ts");
    expect(source).not.toContain("flushPendingText");
    expect(source).toContain("pendingDescriptionRef.current");
  });

  it("instruments sell text input when sell-input-debug is enabled", () => {
    const source = readSource("lib/sell/sell-input-diagnostics.ts");
    expect(source).toContain("rovexo:sell-input-debug");
    expect(source).toContain("sellDebug");
  });

  it("uses a script-free ThemeProvider for forced light theme", () => {
    const source = readSource("components/providers/ThemeProvider.tsx");
    expect(source).not.toMatch(/from [\"']next-themes[\"']/);
    expect(source).not.toContain("<script");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });

  it("persists draft on visibility and bfcache lifecycle events", () => {
    const source = readSource("features/sell/context/SellProvider.tsx");
    expect(source).toContain('addEventListener("visibilitychange"');
    expect(source).toContain('addEventListener("pageshow"');
    expect(source).toContain("persistSellDraftSnapshot");
    expect(source).toContain("loadDraftPhotos");
  });

  it("uses deterministic server/client snapshots for publish button state", () => {
    const source = readSource("features/sell/components/StickyPublishButton.tsx");
    expect(source).toContain("useSyncExternalStore");
    expect(source).toContain("getPendingTextSnapshot");
  });
});
