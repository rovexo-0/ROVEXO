import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Category page mobile-first simplification Phase I", () => {
  it("shows listings immediately without hero, breadcrumbs, or subcategories", () => {
    const view = readSource("features/categories/components/CategoryPageView.tsx");
    expect(view).toContain("ListingCard");
    expect(view).toContain("rx-listing-grid");
    expect(view).toContain("node.name");
    expect(view).not.toContain("pt-[calc(7.5rem");
    expect(view).not.toContain("Breadcrumbs");
    expect(view).not.toContain("SafeImage");
    expect(view).not.toContain("Subcategories");
    expect(view).not.toContain("CategoryChip");
    expect(view).not.toContain("aspect-[21/9]");
    expect(view).not.toContain("getCategoryIcon");
  });

  it("does not modify Homepage or ListingCard for this phase", () => {
    const view = readSource("features/categories/components/CategoryPageView.tsx");
    expect(view).toContain('from "@/components/ui/ListingCard"');
    expect(view).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(view).not.toContain("Homepage");
  });
});
