import { describe, expect, it, vi, beforeEach } from "vitest";

const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath,
}));

describe("revalidatePublishedListing", () => {
  beforeEach(() => {
    revalidatePath.mockClear();
  });

  it("revalidates marketplace surfaces and listing detail", async () => {
    const { revalidatePublishedListing } = await import(
      "@/lib/listings/revalidate-published-listing"
    );

    revalidatePublishedListing("nike-trainers-abc123");

    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/seller/listings");
    expect(revalidatePath).toHaveBeenCalledWith("/user/[username]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/store/[slug]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/search");
    expect(revalidatePath).toHaveBeenCalledWith("/categories");
    expect(revalidatePath).toHaveBeenCalledWith("/listing/nike-trainers-abc123");
  });

  it("status mutation busts public ISR immediately (pause / reactivate / sold)", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const source = readFileSync(
      join(process.cwd(), "app/api/listings/[id]/status/route.ts"),
      "utf8",
    );
    expect(source).toContain("revalidatePublishedListing(listing.slug)");
    expect(source).not.toMatch(/after\s*\(\s*async[\s\S]*revalidatePublishedListing/);
  });
});
