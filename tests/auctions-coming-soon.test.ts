import { describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { GET, POST } from "@/app/api/auctions/notify/route";
import { GET as getAuctionsApi } from "@/app/api/auctions/route";

vi.mock("@/lib/auth/session", () => ({
  requireApiAuth: vi.fn(),
  getAuthContext: vi.fn(),
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

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("auctions launch-ready consumer gate", () => {
  it("redirects /auctions to Search — no consumer Coming Soon page", () => {
    const route = readSource("app/auctions/page.tsx");

    expect(route).toContain('redirect("/search")');
    expect(route).not.toContain("AuctionsComingSoonPage");
    expect(route).not.toContain("AuctionsPage");
    expect(route).not.toContain("getAuctionsPageData");
  });

  it("removes orphan consumer auctions UI (route redirects to Search)", () => {
    expect(existsSync(path.join(process.cwd(), "features/auctions/components/AuctionsPage.tsx"))).toBe(
      false,
    );
    expect(
      existsSync(path.join(process.cwd(), "features/auctions/components/AuctionsComingSoonPage.tsx")),
    ).toBe(false);
  });

  it("retains launch preview copy for future re-enable", () => {
    const content = readSource("lib/auctions/coming-soon-content.ts");
    expect(content).toContain("Real-Time Bidding");
    expect(content).toContain("Instant Bid Updates");
    expect(content).toContain("Watch Auctions");
    expect(content).toContain("Live Notifications");
    expect(content).toContain("Purchase Protection");
    expect(content).toContain("Verified Sellers");
    expect(content).toContain("Win Unique Items");
    expect(content).toContain("Premium Marketplace Experience");
  });
});

describe("auctions notify API", () => {
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

  it("persists launch notification opt-in for authenticated users", async () => {
    const { requireApiAuth } = await import("@/lib/auth/session");
    const { subscribeToAuctionLaunch } = await import("@/lib/auctions/notify-store");

    vi.mocked(requireApiAuth).mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);
    vi.mocked(subscribeToAuctionLaunch).mockResolvedValueOnce(true);

    const response = await POST();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ subscribed: true });
    expect(subscribeToAuctionLaunch).toHaveBeenCalledWith("user-1");
  });
});
