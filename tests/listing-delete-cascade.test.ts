import { describe, expect, it, vi, beforeEach } from "vitest";

function createLikeChain() {
  const chain = {
    like: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
  };
  chain.like.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  return chain;
}

function createAdminMock(options: {
  offerIds?: string[];
  conversationIds?: string[];
}) {
  const like = vi.fn().mockResolvedValue({ error: null });
  const deleteChain = { like };

  const offersChain = createLikeChain();
  offersChain.eq.mockResolvedValue({
    data: (options.offerIds ?? []).map((id) => ({ id })),
    error: null,
  });

  const conversationsChain = createLikeChain();
  conversationsChain.eq.mockResolvedValue({
    data: (options.conversationIds ?? []).map((id) => ({ id })),
    error: null,
  });

  const from = vi.fn((table: string) => {
    if (table === "notifications") {
      return { delete: () => deleteChain };
    }
    if (table === "offers") {
      return { select: () => offersChain };
    }
    if (table === "conversations") {
      return { select: () => conversationsChain };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from, like, offersChain, conversationsChain };
}

describe("purgeListingNotifications", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("purges listing, checkout, saved, offer, and conversation hrefs", async () => {
    const admin = createAdminMock({
      offerIds: ["offer-1"],
      conversationIds: ["conv-1"],
    });

    const { purgeListingNotifications } = await import(
      "@/lib/listings/purge-listing-notifications"
    );

    await purgeListingNotifications(admin as never, {
      id: "prod-1",
      slug: "nike-trainers-abc123",
    });

    expect(admin.from).toHaveBeenCalledWith("notifications");
    expect(admin.from).toHaveBeenCalledWith("offers");
    expect(admin.from).toHaveBeenCalledWith("conversations");

    const likePatterns = admin.like.mock.calls.map(([, pattern]) => pattern);
    expect(likePatterns).toContain("%/listing/nike-trainers-abc123%");
    expect(likePatterns).toContain("%/checkout/nike-trainers-abc123%");
    expect(likePatterns).toContain("%highlight=prod-1%");
    expect(likePatterns).toContain("%offer=offer-1%");
    expect(likePatterns).toContain("%offerId=offer-1%");
    expect(likePatterns).toContain("%/inbox/conversation/conv-1%");
  });
});

describe("revalidateDeletedListing", () => {
  const revalidatePath = vi.fn();

  beforeEach(() => {
    revalidatePath.mockClear();
    vi.resetModules();
    vi.doMock("next/cache", () => ({ revalidatePath }));
  });

  it("revalidates marketplace and user-private surfaces", async () => {
    const { revalidateDeletedListing } = await import(
      "@/lib/listings/revalidate-published-listing"
    );

    revalidateDeletedListing("nike-trainers-abc123");

    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/search");
    expect(revalidatePath).toHaveBeenCalledWith("/saved");
    expect(revalidatePath).toHaveBeenCalledWith("/cart");
    expect(revalidatePath).toHaveBeenCalledWith("/inbox");
    expect(revalidatePath).toHaveBeenCalledWith("/orders");
    expect(revalidatePath).toHaveBeenCalledWith("/wallet");
    expect(revalidatePath).toHaveBeenCalledWith("/notifications");
    expect(revalidatePath).toHaveBeenCalledWith("/user/[username]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/listing/nike-trainers-abc123");
    expect(revalidatePath).toHaveBeenCalledWith("/checkout/nike-trainers-abc123");
  });
});
