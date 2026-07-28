import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  NEW_LISTING_PRIORITY_SORT,
  NEW_LISTING_PRIORITY_STATUS,
  sortByCreatedAtDesc,
} from "@/lib/listings/new-listing-priority-v1";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("new listing priority freeze v1.0", () => {
  it("locks createdAt DESC policy", () => {
    expect(NEW_LISTING_PRIORITY_SORT).toBe("createdAt DESC");
    expect(NEW_LISTING_PRIORITY_STATUS).toBe("LOCKED");
  });

  it("sorts newest first", () => {
    const sorted = sortByCreatedAtDesc([
      { id: "a", createdAt: "2026-01-01T00:00:00.000Z", title: "Old" },
      { id: "b", createdAt: "2026-07-21T12:00:00.000Z", title: "New" },
      { id: "c", createdAt: "2026-03-01T00:00:00.000Z", title: "Mid" },
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["b", "c", "a"]);
  });

  it("seller surface forces newest sort", () => {
    const eligible = readSource("lib/listings/eligible-listings.ts");
    expect(eligible).toContain('surface === "seller"');
    expect(eligible).toContain('sort = "newest"');
  });

  it("searchListings newest is created_at DESC only", () => {
    const repo = readSource("lib/listings/repository.ts");
    expect(repo).toContain('case "newest"');
    expect(repo).toMatch(/case "newest":[\s\S]*order\("created_at", \{ ascending: false \}/);
  });

  it("seller listings + sold/drafts use created_at DESC", () => {
    const seller = readSource("lib/listings/repository.ts");
    expect(seller).toContain(".order(\"created_at\", { ascending: false })");
    const profile = readSource("lib/profile/public.ts");
    expect(profile).toContain('.eq("status", "sold")');
    expect(profile).toContain('.eq("status", "draft")');
    expect(profile).not.toMatch(/status", "sold"[\s\S]{0,200}updated_at/);
    expect(profile).not.toMatch(/status", "draft"[\s\S]{0,200}updated_at/);
  });

  it("publish revalidation includes storefronts", () => {
    const revalidate = readSource("lib/listings/revalidate-published-listing.ts");
    expect(revalidate).toContain('revalidatePath("/seller/listings")');
    expect(revalidate).toContain('revalidatePath("/user/[username]", "page")');
    expect(revalidate).toContain('revalidatePath("/store/[slug]", "page")');
  });
});
