import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveProfileBusinessAction } from "@/lib/business/business-onboarding-contract-v1";
import {
  applyConfirmedSellerContextHint,
  navigateAfterSellerContextSwitch,
  peekConfirmedSellerContext,
  rememberConfirmedSellerContext,
  requestSellerContextSwitch,
  resetSellerContextSwitchClientForTests,
  sellerContextSwitchHref,
} from "@/lib/business/switch-seller-context-client";

afterEach(() => {
  resetSellerContextSwitchClientForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("seller context switch client navigation", () => {
  it("maps Individual → Business Home and Business → Account", () => {
    expect(sellerContextSwitchHref("business")).toBe("/business/dashboard");
    expect(sellerContextSwitchHref("individual")).toBe("/account");
  });

  it("pushes Business Home without refreshing Account in the same tick", () => {
    const router = { push: vi.fn(), refresh: vi.fn() };
    navigateAfterSellerContextSwitch(router, "business", "/account");
    expect(router.push).toHaveBeenCalledOnce();
    expect(router.push).toHaveBeenCalledWith("/business/dashboard");
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("returns to Individual Account from Business surfaces", () => {
    const router = { push: vi.fn(), refresh: vi.fn() };
    navigateAfterSellerContextSwitch(router, "individual", "/business/menu");
    expect(router.push).toHaveBeenCalledWith("/account");
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("refreshes only when already on the destination", () => {
    const router = { push: vi.fn(), refresh: vi.fn() };
    navigateAfterSellerContextSwitch(router, "individual", "/account");
    expect(router.push).not.toHaveBeenCalled();
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("does not navigate when PATCH is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Stripe verification is required.", nextStep: "stripe" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await requestSellerContextSwitch("business");
    expect(result).toEqual({
      ok: false,
      error: "Stripe verification is required.",
      nextStep: "stripe",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("one click produces one PATCH even if invoked twice", async () => {
    let resolveFetch: ((value: unknown) => void) | null = null;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const first = requestSellerContextSwitch("business");
    const second = requestSellerContextSwitch("business");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ context: "business" }),
    });

    resolveFetch?.({
      ok: true,
      json: async () => ({ activeSellerContext: "business", seller_context: "business" }),
    });
    await expect(first).resolves.toEqual({ ok: true, activeSellerContext: "business" });
    await expect(second).resolves.toEqual({ ok: true, activeSellerContext: "business" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(peekConfirmedSellerContext()).toBe("business");
  });

  it("A Individual → Business PATCH 200 updates confirmed context and keeps dashboard dest", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ activeSellerContext: "business", seller_context: "business" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await requestSellerContextSwitch("business");
    expect(result).toEqual({ ok: true, activeSellerContext: "business" });
    expect(peekConfirmedSellerContext()).toBe("business");
    expect(sellerContextSwitchHref("business")).toBe("/business/dashboard");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("B Business → Individual PATCH 200 updates confirmed context so Account cannot keep Business", async () => {
    rememberConfirmedSellerContext("business");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ activeSellerContext: "individual", seller_context: "individual" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await requestSellerContextSwitch("individual");
    expect(result).toEqual({ ok: true, activeSellerContext: "individual" });
    expect(peekConfirmedSellerContext()).toBe("individual");
    const staleAccount = {
      hasBusinessProfile: true,
      stripe: {
        state: "verified" as const,
        verified: true,
        connected: true,
        payoutsEnabled: true,
        chargesEnabled: true,
        detailsSubmitted: true,
        accountIdPresent: true,
        currentlyDueCount: 0,
        eventuallyDueCount: 0,
        disabledReason: null,
      },
      activeSellerContext: "business" as const,
    };
    expect(resolveProfileBusinessAction(staleAccount).kind).toBe("switch-to-individual");
    const synced = applyConfirmedSellerContextHint(staleAccount);
    expect(synced?.activeSellerContext).toBe("individual");
    expect(resolveProfileBusinessAction(synced).kind).toBe("switch-to-business");
    expect(sellerContextSwitchHref("individual")).toBe("/account");
  });

  it("E PATCH failure does not remember a new context", async () => {
    rememberConfirmedSellerContext("business");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Unable to switch seller context." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await requestSellerContextSwitch("individual");
    expect(result.ok).toBe(false);
    expect(peekConfirmedSellerContext()).toBe("business");
    expect(
      applyConfirmedSellerContextHint({
        hasBusinessProfile: true,
        activeSellerContext: "business" as const,
      })?.activeSellerContext,
    ).toBe("business");
  });

  it("C remount hint is consumed once so persisted GET status remains the owner", () => {
    rememberConfirmedSellerContext("individual");
    const stale = {
      hasBusinessProfile: true,
      activeSellerContext: "business" as const,
    };
    expect(applyConfirmedSellerContextHint(stale)?.activeSellerContext).toBe("individual");
    expect(peekConfirmedSellerContext()).toBeNull();
    expect(applyConfirmedSellerContextHint(stale)).toEqual(stale);
    rememberConfirmedSellerContext("individual");
    expect(applyConfirmedSellerContextHint(stale, Date.now() + 16_000)).toEqual(stale);
    expect(peekConfirmedSellerContext()).toBeNull();
  });
});
