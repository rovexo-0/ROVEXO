import { describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { GET, POST } from "@/app/api/auctions/notify/route";
import { GET as getAuctionsApi } from "@/app/api/auctions/route";

vi.mock("@/lib/auth/session", () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock("@/lib/auctions/notify-store", () => ({
  isSubscribedToAuctionLaunch: vi.fn(),
  subscribeToAuctionLaunch: vi.fn(),
}));

vi.mock("@/lib/auctions/queries", () => ({
  getAuctionsPageData: vi.fn(),
}));

const emptyPageData = {
  stats: { liveAuctions: 0, endingSoon: 0, activeBidders: 0, watchingNow: 0 },
  categories: [],
  featured: [],
  endingSoon: [],
  newest: [],
  mostWatched: [],
  all: [],
};

describe("auctions API", () => {
  it("returns auction page data from the listings API", async () => {
    const { getAuctionsPageData } = await import("@/lib/auctions/queries");
    vi.mocked(getAuctionsPageData).mockResolvedValueOnce(emptyPageData);

    const response = await getAuctionsApi(new Request("http://localhost/api/auctions"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toEqual([]);
    expect(body.stats).toEqual(emptyPageData.stats);
  });

  it("requires auth to subscribe for launch notifications", async () => {
    const { requireApiAuth } = await import("@/lib/auth/session");
    vi.mocked(requireApiAuth).mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await POST();
    expect(response.status).toBe(401);
  });

  it("returns subscription status for authenticated users", async () => {
    const { requireApiAuth } = await import("@/lib/auth/session");
    const { isSubscribedToAuctionLaunch } = await import("@/lib/auctions/notify-store");

    vi.mocked(requireApiAuth).mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);
    vi.mocked(isSubscribedToAuctionLaunch).mockResolvedValueOnce(true);

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ subscribed: true });
  });
});
