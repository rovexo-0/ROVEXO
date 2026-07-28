import { describe, expect, it } from "vitest";
import {
  SEARCH_CATEGORY_HEROES_V1,
  getSearchCategoryHeroPath,
} from "@/lib/search/search-category-heroes-v1";
import { CANONICAL_ROOT_CATEGORY_COUNT } from "@/lib/categories/canonical-root-categories-v1";
import { existsSync } from "node:fs";
import path from "node:path";

describe("Search category heroes v1 (Blood XXIX)", () => {
  it("covers exactly the canonical Search roots", () => {
    expect(SEARCH_CATEGORY_HEROES_V1.keys).toHaveLength(CANONICAL_ROOT_CATEGORY_COUNT);
  });

  it("resolves Search-only public PNG paths", () => {
    expect(getSearchCategoryHeroPath("womens-fashion")).toBe(
      "/search/categories/womens-fashion.png",
    );
    expect(getSearchCategoryHeroPath("autoparts")).toBe("/search/categories/autoparts.png");
    expect(getSearchCategoryHeroPath("unknown-key")).toBe("/search/categories/electronics.png");
  });

  it("ships transparent PNG masters (alpha channel)", async () => {
    const sharp = (await import("sharp")).default;
    for (const key of SEARCH_CATEGORY_HEROES_V1.keys) {
      const file = path.join(process.cwd(), "public", "search", "categories", `${key}.png`);
      expect(existsSync(file), `missing ${file}`).toBe(true);
      const meta = await sharp(file).metadata();
      expect(meta.hasAlpha, `${key} must have alpha`).toBe(true);
    }
  });
});
