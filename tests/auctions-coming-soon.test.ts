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

describe("auctions coming soon API", () => {
  it("blocks the legacy auctions listing API", async () => {
    const response = await getAuctionsApi();
    expect(response.status).toBe(404);
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
