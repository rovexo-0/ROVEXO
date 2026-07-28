import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("LIVE Saved heart contract — useProductWatchlist", () => {
  it("optimistic setIsSaved before fetch; rollback on !ok", () => {
    const hook = readSource("features/home/hooks/use-product-watchlist.ts");
    expect(hook).toContain("const nextSaved = !isSaved");
    expect(hook).toContain("setIsSaved(nextSaved)");
    expect(hook).toContain("setIsSaved(!nextSaved)");
    expect(hook.indexOf("setIsSaved(nextSaved)")).toBeLessThan(
      hook.indexOf('fetch("/api/saved"'),
    );
  });

  it("POST save / DELETE unsave payloads match LIVE", () => {
    const hook = readSource("features/home/hooks/use-product-watchlist.ts");
    expect(hook).toContain("productSlug: slug");
    expect(hook).toContain("productSlugs: [slug]");
    expect(hook).not.toContain("publishSavedLive");
    expect(hook).not.toContain("router.refresh");
  });
});
