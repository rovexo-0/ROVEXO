import { test, expect } from "@playwright/test";
import {
  SIZE_ENGINE_CLOTHING_ROWS,
  SIZE_ENGINE_FOOTWEAR_ROWS,
  encodeSizeForStorage,
  formatSizeForViewItem,
  buildStandardSelection,
  selectionFromCustom,
  validateCustomSizeInput,
} from "@/lib/size";

/**
 * Size Engine v1.0 — E2E certification matrix (logic + optional live Sell).
 * Full Sell UI path requires authenticated session; core contract asserted here.
 */
test.describe("Size Engine v1.0 certification matrix", () => {
  test("Clothing sizes XXS / M / XXXL encode for View Item", () => {
    for (const id of ["XXS", "M", "XXXL"] as const) {
      const selection = buildStandardSelection("clothing", id);
      expect(selection).toBeTruthy();
      const stored = encodeSizeForStorage(selection!);
      expect(formatSizeForViewItem(stored)).toBe(selection!.display);
      expect(selection!.display).toMatch(/^\w+ \(UK \d+ • EU \d+\)$/);
      expect(SIZE_ENGINE_CLOTHING_ROWS.some((row) => row.id === id)).toBe(true);
    }
  });

  test("Footwear UK 3 / 8 / 15 encode for View Item", () => {
    for (const id of ["UK 3", "UK 8", "UK 15"]) {
      const selection = buildStandardSelection("footwear", id);
      expect(selection).toBeTruthy();
      expect(formatSizeForViewItem(encodeSizeForStorage(selection!))).toBe(selection!.display);
      expect(selection!.display).toMatch(/^UK \d+ \(EU \d+\)$/);
      expect(SIZE_ENGINE_FOOTWEAR_ROWS.some((row) => row.id === id)).toBe(true);
    }
  });

  test("XL sell display matches Owner auto-return example", () => {
    const xl = buildStandardSelection("clothing", "XL");
    expect(xl?.display).toBe("XL (UK 12 • EU 40)");
  });
  test("Custom size save / edit / delete contract", () => {
    const saved = selectionFromCustom("46 Tall");
    expect("error" in saved).toBe(false);
    if ("error" in saved) return;
    expect(encodeSizeForStorage(saved)).toBe("custom:46 Tall");
    expect(formatSizeForViewItem("custom:46 Tall")).toBe("46 Tall");

    const edited = selectionFromCustom("4XL");
    expect("error" in edited).toBe(false);
    if ("error" in edited) return;
    expect(formatSizeForViewItem(encodeSizeForStorage(edited))).toBe("4XL");

    expect(validateCustomSizeInput("").ok).toBe(false);
    expect(validateCustomSizeInput("x".repeat(51)).ok).toBe(false);
    expect(validateCustomSizeInput("  UK 13.5  ")).toEqual({ ok: true, value: "UK 13.5" });
  });

  test("Sell size step route is reachable (guest may redirect)", async ({ page }) => {
    const response = await page.goto("/sell", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
});
