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
    expect(revalidatePath).toHaveBeenCalledWith("/search");
    expect(revalidatePath).toHaveBeenCalledWith("/categories");
    expect(revalidatePath).toHaveBeenCalledWith("/listing/nike-trainers-abc123");
  });
});
