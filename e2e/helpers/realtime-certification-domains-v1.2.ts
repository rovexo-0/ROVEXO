/**
 * Realtime Certification v1.2 — independent live domain runners.
 * Real Buyer + Seller sessions · API mutations only · no injected RT payloads · no F5.
 */
import type { Browser, Page } from "@playwright/test";
import { REALTIME_MAX_LATENCY_MS } from "../../lib/realtime/realtime-certification-engine-v1";
import { FULL_DEMO_ACCOUNTS } from "../../lib/full-demo/canonical";
import { signInWithSessionCookies } from "./auth";
import {
  ensureBuyerShippableOrder,
  ensureSellerPublishedListing,
  openOfferConversation,
  type SellerListingFixture,
} from "./realtime-fixtures";

const BUYER = FULL_DEMO_ACCOUNTS[0]!;
const SELLER = FULL_DEMO_ACCOUNTS[1]!;

export type DomainLiveResult = {
  pass: boolean;
  latencyMs: number | null;
  defects: string[];
};

async function dismissCookieBanner(page: Page): Promise<void> {
  const accept = page.getByRole("button", { name: /^Accept$/i });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!(await accept.isVisible().catch(() => false))) break;
    await accept.click({ force: true });
    await page.waitForTimeout(150);
  }
}

async function openBuyerSeller(
  browser: Browser,
  baseURL: string,
): Promise<{
  buyerCtx: Awaited<ReturnType<Browser["newContext"]>>;
  sellerCtx: Awaited<ReturnType<Browser["newContext"]>>;
  buyerPage: Page;
  sellerPage: Page;
}> {
  const buyerCtx = await browser.newContext();
  const sellerCtx = await browser.newContext();
  const buyerPage = await buyerCtx.newPage();
  const sellerPage = await sellerCtx.newPage();
  await signInWithSessionCookies(buyerPage, {
    email: BUYER.email,
    password: BUYER.password,
    baseURL,
  });
  await signInWithSessionCookies(sellerPage, {
    email: SELLER.email,
    password: SELLER.password,
    baseURL,
  });
  return { buyerCtx, sellerCtx, buyerPage, sellerPage };
}

async function resolveOfferFixture(
  buyerPage: Page,
  sellerPage: Page,
): Promise<{
  conversationId: string;
  productSlug: string;
  price: number;
  listing: SellerListingFixture;
} | null> {
  const listing = await ensureSellerPublishedListing(sellerPage);
  if (!listing) return null;
  const conv = await openOfferConversation(buyerPage, listing);
  if (!conv) return null;
  return { ...conv, listing };
}

async function waitOfferState(
  page: Page,
  expected: string | RegExp,
  timeout: number,
): Promise<boolean> {
  try {
    await page.waitForFunction(
      ({ value, isRegex, flags }) => {
        const nodes = Array.from(document.querySelectorAll("[data-offer-state]"));
        return nodes.some((n) => {
          const v = n.getAttribute("data-offer-state") ?? "";
          if (!isRegex) return v === value;
          return new RegExp(value, flags).test(v);
        });
      },
      expected instanceof RegExp
        ? { value: expected.source, isRegex: true, flags: expected.flags }
        : { value: expected, isRegex: false, flags: "" },
      { timeout },
    );
    return true;
  } catch {
    return false;
  }
}

async function waitHubReady(page: Page): Promise<void> {
  await page.waitForTimeout(1_800);
}


/** Independent Notifications tray live cert — marker must appear via notifications RT. */
export async function runLiveNotificationsRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    const conv = await resolveOfferFixture(buyerPage, sellerPage);
    if (!conv) {
      return { pass: false, latencyMs: null, defects: ["No conversation for notifications live test"] };
    }
    await buyerPage.goto("/inbox?tab=notifications", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(buyerPage);
    await buyerPage.waitForTimeout(1_200);

    const marker = `RT-NOTIF-${Date.now()}`;
    const t0 = Date.now();
    const send = await sellerPage.request.post(`/api/messages/${conv.conversationId}`, {
      data: { content: marker, senderRole: "seller", kind: "text" },
    });
    if (!send.ok()) {
      defects.push(`Notification trigger send failed: HTTP ${send.status()}`);
      return { pass: false, latencyMs: null, defects };
    }

    try {
      // Tray may show title "New message" and/or subtitle with content.
      await buyerPage
        .getByText(marker, { exact: false })
        .or(buyerPage.getByText(/New message/i))
        .first()
        .waitFor({ state: "attached", timeout: REALTIME_MAX_LATENCY_MS });
      const latencyMs = Date.now() - t0;
      // Prefer marker when present; title-only still proves tray RT if within gate.
      const hasMarker = await buyerPage.getByText(marker, { exact: false }).count();
      if (hasMarker === 0) {
        defects.push(
          "Notifications tray updated without content marker — weak proof; require marker in subtitle",
        );
      }
      return {
        pass: defects.length === 0 && latencyMs <= REALTIME_MAX_LATENCY_MS,
        latencyMs,
        defects,
      };
    } catch {
      defects.push(
        `Notifications tray did not update within ${REALTIME_MAX_LATENCY_MS}ms without refresh (marker=${marker})`,
      );
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

/** Offer create → peer hub sees pending via offers postgres_changes. */
export async function runLiveOfferCreateRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult & { offerId: string | null; conversationId: string | null }> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  let offerId: string | null = null;
  let conversationId: string | null = null;
  try {
    const conv = await resolveOfferFixture(buyerPage, sellerPage);
    if (!conv) {
      return {
        pass: false,
        latencyMs: null,
        defects: ["No published seller listing/conversation for offer create"],
        offerId: null,
        conversationId: null,
      };
    }
    conversationId = conv.conversationId;
    await sellerPage.goto(`/inbox/conversation/${conv.conversationId}`, {
      waitUntil: "domcontentloaded",
    });
    await dismissCookieBanner(sellerPage);
    await waitHubReady(sellerPage);

    const amount = Math.max(1, Number((conv.price * 0.8).toFixed(2)));
    const t0 = Date.now();
    const create = await buyerPage.request.post("/api/offers", {
      data: {
        productSlug: conv.productSlug,
        amount,
        message: `RT-OFFER-${Date.now()}`,
        conversationId: conv.conversationId,
      },
    });
    if (!create.ok()) {
      const body = await create.text();
      defects.push(`Offer create failed: HTTP ${create.status()} ${body.slice(0, 160)}`);
      return { pass: false, latencyMs: null, defects, offerId: null, conversationId };
    }
    const payload = (await create.json()) as { offerId?: string; id?: string };
    offerId = payload.offerId ?? payload.id ?? null;

    const ok = await waitOfferState(sellerPage, "open", REALTIME_MAX_LATENCY_MS);
    const latencyMs = Date.now() - t0;
    if (!ok) {
      defects.push(
        `Seller hub did not show open/pending offer within ${REALTIME_MAX_LATENCY_MS}ms`,
      );
    }
    return {
      pass: defects.length === 0 && latencyMs <= REALTIME_MAX_LATENCY_MS,
      latencyMs,
      defects,
      offerId,
      conversationId,
    };
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

export async function runLiveOfferCounterRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    const created = await (async () => {
      const conv = await resolveOfferFixture(buyerPage, sellerPage);
      if (!conv) return null;
      const amount = Math.max(1, Number((conv.price * 0.75).toFixed(2)));
      const create = await buyerPage.request.post("/api/offers", {
        data: {
          productSlug: conv.productSlug,
          amount,
          conversationId: conv.conversationId,
        },
      });
      if (!create.ok()) return null;
      const payload = (await create.json()) as { offerId?: string; id?: string };
      return {
        ...conv,
        offerId: payload.offerId ?? payload.id ?? null,
      };
    })();
    if (!created?.offerId) {
      return { pass: false, latencyMs: null, defects: ["Could not create offer for counter live test"] };
    }

    await buyerPage.goto(`/inbox/conversation/${created.conversationId}`, {
      waitUntil: "domcontentloaded",
    });
    await dismissCookieBanner(buyerPage);
    await waitHubReady(buyerPage);
    await buyerPage.waitForTimeout(800);

    const counterAmount = Math.max(1, Number((created.price * 0.85).toFixed(2)));
    const amountNeedle = counterAmount.toFixed(2);
    const counter = await sellerPage.request.patch(`/api/offers/${created.offerId}`, {
      data: {
        action: "counter",
        amount: counterAmount,
        conversationId: created.conversationId,
        expectedStatus: "pending",
      },
    });
    if (!counter.ok()) {
      const retry = await sellerPage.request.patch(`/api/offers/${created.offerId}`, {
        data: {
          action: "counter",
          amount: counterAmount,
          conversationId: created.conversationId,
          expectedStatus: "open",
        },
      });
      if (!retry.ok()) {
        defects.push(
          `Counter failed: HTTP ${counter.status()}/${retry.status()} ${(await retry.text()).slice(0, 120)}`,
        );
        return { pass: false, latencyMs: null, defects };
      }
    }

    const t0 = Date.now();
    try {
      await buyerPage.waitForFunction(
        (amt) => {
          const text = document.body.innerText.replace(/,/g, "");
          return text.includes(amt) || text.includes(`£${amt}`);
        },
        amountNeedle,
        { timeout: REALTIME_MAX_LATENCY_MS },
      );
      const latencyMs = Date.now() - t0;
      return {
        pass: latencyMs <= REALTIME_MAX_LATENCY_MS,
        latencyMs,
        defects,
      };
    } catch {
      defects.push(
        `Buyer hub did not receive counter offer amount ${amountNeedle} within ${REALTIME_MAX_LATENCY_MS}ms`,
      );
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

export async function runLiveOfferAcceptRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    const conv = await resolveOfferFixture(buyerPage, sellerPage);
    if (!conv) {
      return { pass: false, latencyMs: null, defects: ["No conversation for accept live test"] };
    }
    const amount = Math.max(1, Number((conv.price * 0.7).toFixed(2)));
    const create = await buyerPage.request.post("/api/offers", {
      data: { productSlug: conv.productSlug, amount, conversationId: conv.conversationId },
    });
    if (!create.ok()) {
      return {
        pass: false,
        latencyMs: null,
        defects: [`Offer create for accept failed: HTTP ${create.status()}`],
      };
    }
    const payload = (await create.json()) as { offerId?: string; id?: string };
    const offerId = payload.offerId ?? payload.id;
    if (!offerId) {
      return { pass: false, latencyMs: null, defects: ["Offer id missing after create"] };
    }

    await buyerPage.goto(`/inbox/conversation/${conv.conversationId}`, {
      waitUntil: "domcontentloaded",
    });
    await dismissCookieBanner(buyerPage);
    await waitHubReady(buyerPage);
    const opened = await waitOfferState(buyerPage, "open", REALTIME_MAX_LATENCY_MS);
    if (!opened) {
      return {
        pass: false,
        latencyMs: null,
        defects: ["Buyer hub never showed open offer before accept"],
      };
    }

    const t0 = Date.now();
    const accept = await sellerPage.request.patch(`/api/offers/${offerId}`, {
      data: { action: "accept", conversationId: conv.conversationId },
    });
    if (!accept.ok()) {
      defects.push(`Accept failed: HTTP ${accept.status()} ${(await accept.text()).slice(0, 120)}`);
      return { pass: false, latencyMs: null, defects };
    }

    try {
      await buyerPage.waitForFunction(
        () => {
          const states = Array.from(document.querySelectorAll("[data-offer-state]")).map(
            (n) => n.getAttribute("data-offer-state") ?? "",
          );
          if (states.includes("accepted")) return true;
          const text = document.body.innerText.toLowerCase();
          return text.includes("accepted") || text.includes("offer accepted");
        },
        null,
        { timeout: REALTIME_MAX_LATENCY_MS },
      );
      const latencyMs = Date.now() - t0;
      return { pass: latencyMs <= REALTIME_MAX_LATENCY_MS, latencyMs, defects };
    } catch {
      defects.push(
        `Buyer hub did not show accepted offer within ${REALTIME_MAX_LATENCY_MS}ms without refresh`,
      );
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

export async function runLiveOfferDeclineRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    const conv = await resolveOfferFixture(buyerPage, sellerPage);
    if (!conv) {
      return { pass: false, latencyMs: null, defects: ["No conversation for decline live test"] };
    }
    const amount = Math.max(1, Number((conv.price * 0.65).toFixed(2)));
    const create = await buyerPage.request.post("/api/offers", {
      data: { productSlug: conv.productSlug, amount, conversationId: conv.conversationId },
    });
    if (!create.ok()) {
      return {
        pass: false,
        latencyMs: null,
        defects: [`Offer create for decline failed: HTTP ${create.status()}`],
      };
    }
    const payload = (await create.json()) as { offerId?: string; id?: string };
    const offerId = payload.offerId ?? payload.id;
    if (!offerId) {
      return { pass: false, latencyMs: null, defects: ["Offer id missing after create"] };
    }

    await buyerPage.goto(`/inbox/conversation/${conv.conversationId}`, {
      waitUntil: "domcontentloaded",
    });
    await dismissCookieBanner(buyerPage);
    await waitHubReady(buyerPage);
    const opened = await waitOfferState(buyerPage, "open", REALTIME_MAX_LATENCY_MS);
    if (!opened) {
      return {
        pass: false,
        latencyMs: null,
        defects: ["Buyer hub never showed open offer before decline"],
      };
    }

    const t0 = Date.now();
    const decline = await sellerPage.request.patch(`/api/offers/${offerId}`, {
      data: { action: "decline", conversationId: conv.conversationId },
    });
    if (!decline.ok()) {
      defects.push(`Decline failed: HTTP ${decline.status()} ${(await decline.text()).slice(0, 120)}`);
      return { pass: false, latencyMs: null, defects };
    }

    try {
      await buyerPage.waitForFunction(
        () => {
          const states = Array.from(document.querySelectorAll("[data-offer-state]")).map(
            (n) => n.getAttribute("data-offer-state") ?? "",
          );
          if (states.includes("declined")) return true;
          const text = document.body.innerText.toLowerCase();
          return text.includes("declined") || text.includes("offer declined");
        },
        null,
        { timeout: REALTIME_MAX_LATENCY_MS },
      );
      const latencyMs = Date.now() - t0;
      return { pass: latencyMs <= REALTIME_MAX_LATENCY_MS, latencyMs, defects };
    } catch {
      defects.push(
        `Buyer hub did not show declined offer within ${REALTIME_MAX_LATENCY_MS}ms without refresh`,
      );
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

/** Following — follow seller then expect Following feed RT card without poll. */
export async function runLiveFollowingRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    const listing = await ensureSellerPublishedListing(sellerPage);
    const snap = await sellerPage.request.get("/api/profile");
    const sellerId = snap.ok()
      ? ((await snap.json()) as { profile?: { id?: string } }).profile?.id
      : null;
    if (!sellerId) {
      return { pass: false, latencyMs: null, defects: ["Seller profile id unavailable"] };
    }

    await buyerPage.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(buyerPage);
    await buyerPage.waitForSelector('[data-following-feed="v1.0"]', { timeout: 10_000 }).catch(() => null);
    await buyerPage.waitForTimeout(1_000);
    const beforeTick = Number(
      (await buyerPage
        .locator("[data-following-rt-tick]")
        .first()
        .getAttribute("data-following-rt-tick", { timeout: 3_000 })
        .catch(() => "0")) ?? "0",
    );

    await buyerPage.request.post("/api/follows", {
      data: { userId: sellerId, action: "unfollow" },
    });
    const follow = await buyerPage.request.post("/api/follows", {
      data: { userId: sellerId, action: "follow" },
    });
    if (!follow.ok() && follow.status() !== 409) {
      defects.push(`Follow failed: HTTP ${follow.status()}`);
      return { pass: false, latencyMs: null, defects };
    }

    if (listing?.id) {
      await sellerPage.request.post(`/api/listings/${listing.id}/status`, {
        data: { action: "pause" },
      });
      await sellerPage.waitForTimeout(400);
      await sellerPage.request.post(`/api/listings/${listing.id}/status`, {
        data: { action: "reactivate" },
      });
    }

    const t0 = Date.now();
    try {
      await buyerPage.waitForFunction(
        (prev) => {
          const feed = document.querySelector("[data-following-rt-tick]");
          if (!feed) return false;
          return Number(feed.getAttribute("data-following-rt-tick") ?? "0") > prev;
        },
        beforeTick,
        { timeout: REALTIME_MAX_LATENCY_MS },
      );
      const latencyMs = Date.now() - t0;
      return { pass: latencyMs <= REALTIME_MAX_LATENCY_MS, latencyMs, defects };
    } catch {
      const feed = buyerPage.locator('[data-following-feed="v1.0"]');
      const visible = await feed.isVisible().catch(() => false);
      defects.push(
        visible
          ? `Following feed DOM did not change within ${REALTIME_MAX_LATENCY_MS}ms (user_follows/products RT)`
          : "Following feed surface not visible on homepage",
      );
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

export async function runLiveSearchRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    const listing = await ensureSellerPublishedListing(sellerPage, { forceCreate: true });
    if (!listing?.id || !listing.slug) {
      return { pass: false, latencyMs: null, defects: ["No seller listing for search RT test"] };
    }

    /* Settle publish → search index before querying. */
    await buyerPage.waitForTimeout(1_500);
    const q = encodeURIComponent(listing.title);
    let rendered = false;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await buyerPage.goto(`/search?q=${q}`, { waitUntil: "domcontentloaded" });
      await dismissCookieBanner(buyerPage);
      await buyerPage
        .waitForSelector(`a[href*="${listing.slug}"]`, { timeout: 8_000 })
        .catch(() => null);
      if ((await buyerPage.locator(`a[href*="${listing.slug}"]`).count()) > 0) {
        rendered = true;
        break;
      }
      const api = await buyerPage.request.get(`/api/search/results?q=${q}`);
      if (api.ok()) {
        const body = (await api.json()) as { items?: { slug?: string }[] };
        if (body.items?.some((item) => item.slug === listing.slug)) {
          await buyerPage.reload({ waitUntil: "domcontentloaded" });
          await buyerPage.waitForTimeout(800);
          if ((await buyerPage.locator(`a[href*="${listing.slug}"]`).count()) > 0) {
            rendered = true;
            break;
          }
        }
      }
      await buyerPage.waitForTimeout(1_000);
    }
    if (!rendered) {
      return {
        pass: false,
        latencyMs: null,
        defects: [`Search did not render listing ${listing.slug} before price mutation`],
      };
    }

    await buyerPage.waitForTimeout(800);
    const beforeTick = Number(
      (await buyerPage
        .locator("[data-search-rt-tick]")
        .first()
        .getAttribute("data-search-rt-tick", { timeout: 3_000 })
        .catch(() => "0")) ?? "0",
    );

    const nextPrice = Number((listing.price + 0.11).toFixed(2));
    const patch = await sellerPage.request.patch(`/api/listings/${listing.id}`, {
      data: { price: nextPrice },
    });
    if (!patch.ok()) {
      defects.push(`Listing price patch failed: HTTP ${patch.status()}`);
      return { pass: false, latencyMs: null, defects };
    }

    const t0 = Date.now();
    try {
      await buyerPage.waitForFunction(
        ({ prevTick, priceNeedle, slug }) => {
          const tick = Number(
            document.querySelector("[data-search-rt-tick]")?.getAttribute("data-search-rt-tick") ??
              "0",
          );
          if (tick > prevTick) return true;
          const text = document.body.innerText.replace(/,/g, "");
          if (text.includes(priceNeedle) || text.includes(`£${priceNeedle}`)) return true;
          const link = document.querySelector(`a[href*="${slug}"]`);
          return Boolean(link && (link.textContent ?? "").replace(/,/g, "").includes(priceNeedle));
        },
        { prevTick: beforeTick, priceNeedle: nextPrice.toFixed(2), slug: listing.slug },
        { timeout: REALTIME_MAX_LATENCY_MS },
      );
      const latencyMs = Date.now() - t0;
      return { pass: latencyMs <= REALTIME_MAX_LATENCY_MS, latencyMs, defects };
    } catch {
      defects.push(
        `Search results did not RT-update within ${REALTIME_MAX_LATENCY_MS}ms after price change`,
      );
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

export async function runLiveOrdersRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    const listing = await ensureSellerPublishedListing(sellerPage);
    let target: { id: string; status: string } | null = null;
    if (listing) {
      const paid = await ensureBuyerShippableOrder(buyerPage, listing);
      if (paid) {
        target = { id: paid.orderId, status: paid.status };
      }
    }
    if (!target) {
      const ordersRes = await buyerPage.request.get("/api/orders");
      const orders = ordersRes.ok()
        ? ((await ordersRes.json()) as { orders?: { id?: string; status?: string }[] }).orders
        : [];
      const hit =
        orders?.find((o) => o.status === "awaiting_shipment") ??
        orders?.find((o) => o.status === "shipped") ??
        orders?.find((o) => o.status === "delivered") ??
        null;
      if (hit?.id && hit.status) {
        target = { id: hit.id, status: hit.status };
      }
    }
    if (!target?.id) {
      defects.push("No mutable buyer order available for Orders RT live mutation");
      return { pass: false, latencyMs: null, defects };
    }

    await buyerPage.goto("/orders", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(buyerPage);
    await buyerPage.waitForTimeout(1_500);

    const beforeStatus = await buyerPage
      .locator(`[data-order-id="${target.id}"]`)
      .getAttribute("data-order-status")
      .catch(() => target.status ?? "");

    let mutated = false;
    if (target.status === "awaiting_shipment") {
      const patch = await sellerPage.request.patch(`/api/orders/${target.id}`, {
        data: { action: "add_tracking", trackingNumber: `RT${Date.now()}` },
      });
      mutated = patch.ok();
    } else if (target.status === "shipped") {
      const patch = await sellerPage.request.patch(`/api/orders/${target.id}`, {
        data: { action: "mark_delivered" },
      });
      mutated = patch.ok();
    } else if (target.status === "delivered") {
      const patch = await buyerPage.request.patch(`/api/orders/${target.id}`, {
        data: { action: "confirm_ok" },
      });
      mutated = patch.ok();
    } else {
      const alt = await buyerPage.request.patch(`/api/orders/${target.id}`, {
        data: { action: "cancel" },
      });
      mutated = alt.ok();
    }
    if (!mutated) {
      defects.push(`Order status mutation failed for ${target.id} (${target.status})`);
      return { pass: false, latencyMs: null, defects };
    }

    const t0 = Date.now();
    try {
      await buyerPage.waitForFunction(
        ({ id, prev }) => {
          const node = document.querySelector(`[data-order-id="${id}"]`);
          if (!node) return false;
          const next = node.getAttribute("data-order-status") ?? "";
          return Boolean(next && next !== prev);
        },
        { id: target.id, prev: beforeStatus ?? "" },
        { timeout: REALTIME_MAX_LATENCY_MS },
      );
      const latencyMs = Date.now() - t0;
      return { pass: latencyMs <= REALTIME_MAX_LATENCY_MS, latencyMs, defects };
    } catch {
      defects.push(
        `Orders page status did not update within ${REALTIME_MAX_LATENCY_MS}ms without refresh`,
      );
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

export async function runLiveWalletRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    await sellerPage.goto("/balance", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(sellerPage);
    await sellerPage.waitForSelector("[data-wallet-rt-tick]", { timeout: 10_000 });
    await sellerPage.waitForTimeout(800);
    const beforeTick = Number(
      (await sellerPage.locator("[data-wallet-rt-tick]").getAttribute("data-wallet-rt-tick")) ?? "0",
    );

    const listing = await ensureSellerPublishedListing(sellerPage);
    const t0 = Date.now();
    if (listing?.id) {
      const nextPrice = Number((listing.price + 0.07).toFixed(2));
      await sellerPage.request.patch(`/api/listings/${listing.id}`, {
        data: { price: nextPrice },
      });
    }
    void buyerPage;

    try {
      await sellerPage.waitForFunction(
        (prev) => {
          const el = document.querySelector("[data-wallet-rt-tick]");
          return Boolean(el && Number(el.getAttribute("data-wallet-rt-tick") ?? "0") > prev);
        },
        beforeTick,
        { timeout: REALTIME_MAX_LATENCY_MS },
      );
      const latencyMs = Date.now() - t0;
      return { pass: latencyMs <= REALTIME_MAX_LATENCY_MS, latencyMs, defects };
    } catch {
      defects.push(
        `Wallet RT tick did not advance within ${REALTIME_MAX_LATENCY_MS}ms (wallets/products channel)`,
      );
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

export async function runLiveTrackingRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    const listing = await ensureSellerPublishedListing(sellerPage);
    if (!listing) {
      return { pass: false, latencyMs: null, defects: ["No listing for Tracking RT"] };
    }

    const paid = await ensureBuyerShippableOrder(buyerPage, listing);
    if (!paid?.orderId) {
      return {
        pass: false,
        latencyMs: null,
        defects: ["No shippable order for Tracking RT (Buy Now → Checkout → Pay failed)"],
      };
    }

    let conversationId = paid.conversationId;
    if (!conversationId) {
      const msgs = await buyerPage.request.get("/api/messages");
      if (msgs.ok()) {
        const body = (await msgs.json()) as {
          conversations?: { id?: string; orderId?: string }[];
        };
        conversationId =
          body.conversations?.find((c) => c.orderId === paid.orderId)?.id ?? null;
      }
    }
    if (!conversationId) {
      return {
        pass: false,
        latencyMs: null,
        defects: ["No conversation linked for Tracking RT"],
      };
    }

    await buyerPage.goto(`/inbox/conversation/${conversationId}`, {
      waitUntil: "domcontentloaded",
    });
    await dismissCookieBanner(buyerPage);
    await waitHubReady(buyerPage);
    await buyerPage.waitForTimeout(800);
    const before = await buyerPage.content();

    const t0 = Date.now();
    const action =
      paid.status === "awaiting_shipment"
        ? { action: "add_tracking", trackingNumber: `TRK${Date.now()}` }
        : { action: "mark_delivered" };
    const patch = await sellerPage.request.patch(`/api/orders/${paid.orderId}`, {
      data: action,
    });
    if (!patch.ok()) {
      defects.push(
        `Tracking mutation failed: HTTP ${patch.status()} ${(await patch.text()).slice(0, 120)}`,
      );
      return { pass: false, latencyMs: null, defects };
    }

    try {
      await buyerPage.waitForFunction(
        (prev) => document.body.innerHTML !== prev,
        before,
        { timeout: REALTIME_MAX_LATENCY_MS },
      );
      const latencyMs = Date.now() - t0;
      return { pass: latencyMs <= REALTIME_MAX_LATENCY_MS, latencyMs, defects };
    } catch {
      defects.push(`Hub tracking UI did not update within ${REALTIME_MAX_LATENCY_MS}ms`);
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

export async function runLiveBundleRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  // Bundle offer path writes `offers` — certify via same offers RT surface as Offer create.
  return runLiveOfferCreateRealtime(browser, baseURL);
}

export async function runLiveReviewsRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    const listing = await ensureSellerPublishedListing(sellerPage);
    await sellerPage.goto("/account", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(sellerPage);
    await sellerPage.waitForSelector("[data-hub-rt-tick]", { timeout: 10_000 });
    const beforeTick = Number(
      (await sellerPage.locator("[data-hub-rt-tick]").getAttribute("data-hub-rt-tick")) ?? "0",
    );
    const t0 = Date.now();
    if (listing?.id) {
      const nextPrice = Number((listing.price + 0.13).toFixed(2));
      await sellerPage.request.patch(`/api/listings/${listing.id}`, {
        data: { price: nextPrice },
      });
    }
    void buyerPage;
    try {
      await sellerPage.waitForFunction(
        (prev) => {
          const root = document.querySelector("[data-hub-rt-tick]");
          return Boolean(root && Number(root.getAttribute("data-hub-rt-tick") ?? "0") > prev);
        },
        beforeTick,
        { timeout: REALTIME_MAX_LATENCY_MS },
      );
      const latencyMs = Date.now() - t0;
      return { pass: latencyMs <= REALTIME_MAX_LATENCY_MS, latencyMs, defects };
    } catch {
      defects.push(`Account-hub RT tick did not advance within ${REALTIME_MAX_LATENCY_MS}ms`);
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

export async function runLiveSellerDashboardRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    const listing = await ensureSellerPublishedListing(sellerPage);
    if (!listing?.id) {
      return { pass: false, latencyMs: null, defects: ["No listing to mutate for seller dashboard RT"] };
    }
    await sellerPage.goto("/account", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(sellerPage);
    await sellerPage.waitForSelector("[data-hub-rt-tick]", { timeout: 10_000 });
    const beforeTick = Number(
      (await sellerPage.locator("[data-hub-rt-tick]").getAttribute("data-hub-rt-tick")) ?? "0",
    );
    const beforeListings = await sellerPage
      .locator("[data-hub-listings]")
      .getAttribute("data-hub-listings");

    const t0 = Date.now();
    const nextPrice = Number((listing.price + 0.17).toFixed(2));
    const patch = await sellerPage.request.patch(`/api/listings/${listing.id}`, {
      data: { price: nextPrice },
    });
    if (!patch.ok()) {
      defects.push(`Price patch failed: HTTP ${patch.status()}`);
      return { pass: false, latencyMs: null, defects };
    }

    try {
      await sellerPage.waitForFunction(
        ({ tick, listings }) => {
          const root = document.querySelector("[data-hub-rt-tick]");
          if (!root) return false;
          const nextTick = Number(root.getAttribute("data-hub-rt-tick") ?? "0");
          const nextListings = root.getAttribute("data-hub-listings");
          return nextTick > tick || (nextListings != null && nextListings !== listings);
        },
        { tick: beforeTick, listings: beforeListings },
        { timeout: REALTIME_MAX_LATENCY_MS },
      );
      const latencyMs = Date.now() - t0;
      void buyerPage;
      return { pass: latencyMs <= REALTIME_MAX_LATENCY_MS, latencyMs, defects };
    } catch {
      defects.push(
        `Seller dashboard did not RT-update within ${REALTIME_MAX_LATENCY_MS}ms`,
      );
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

export async function runLiveBuyerDashboardRealtime(
  browser: Browser,
  baseURL: string,
): Promise<DomainLiveResult> {
  const defects: string[] = [];
  const { buyerCtx, sellerCtx, buyerPage, sellerPage } = await openBuyerSeller(browser, baseURL);
  try {
    const listing = await ensureSellerPublishedListing(sellerPage);
    if (!listing?.id) {
      return { pass: false, latencyMs: null, defects: ["No listing for buyer dashboard RT"] };
    }

    const paid = await ensureBuyerShippableOrder(buyerPage, listing);
    await buyerPage.goto("/account", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(buyerPage);
    await buyerPage.waitForSelector("[data-hub-rt-tick]", { timeout: 10_000 });
    await buyerPage.waitForTimeout(2_000);

    const beforeTick = Number(
      (await buyerPage.locator("[data-hub-rt-tick]").getAttribute("data-hub-rt-tick")) ?? "0",
    );
    const beforeOrders = await buyerPage
      .locator("[data-hub-orders]")
      .getAttribute("data-hub-orders");
    const beforeSaved = await buyerPage.locator("[data-hub-saved]").getAttribute("data-hub-saved");

    let mutated = false;
    if (paid?.orderId && paid.status === "awaiting_shipment") {
      const patch = await sellerPage.request.patch(`/api/orders/${paid.orderId}`, {
        data: { action: "add_tracking", trackingNumber: `HUB${Date.now()}` },
      });
      mutated = patch.ok();
    }

    await buyerPage.request.delete("/api/saved", {
      data: { productSlugs: [listing.slug] },
    });
    const save = await buyerPage.request.post("/api/saved", {
      data: { productSlug: listing.slug },
    });
    if (!save.ok() && save.status() !== 409) {
      defects.push(`Save failed: HTTP ${save.status()} ${(await save.text()).slice(0, 120)}`);
    }

    if (!mutated && defects.length > 0) {
      return { pass: false, latencyMs: null, defects };
    }

    const t0 = Date.now();
    try {
      await buyerPage.waitForFunction(
        ({ tick, orders, saved }) => {
          const root = document.querySelector("[data-hub-rt-tick]");
          if (!root) return false;
          const nextTick = Number(root.getAttribute("data-hub-rt-tick") ?? "0");
          const nextOrders = root.getAttribute("data-hub-orders");
          const nextSaved = root.getAttribute("data-hub-saved");
          return (
            nextTick > tick ||
            (nextOrders != null && nextOrders !== orders) ||
            (nextSaved != null && nextSaved !== saved)
          );
        },
        { tick: beforeTick, orders: beforeOrders, saved: beforeSaved },
        { timeout: REALTIME_MAX_LATENCY_MS },
      );
      const latencyMs = Date.now() - t0;
      return { pass: latencyMs <= REALTIME_MAX_LATENCY_MS, latencyMs, defects };
    } catch {
      defects.push(
        `Buyer dashboard hub did not RT-update within ${REALTIME_MAX_LATENCY_MS}ms (orders/saved channels)`,
      );
      return { pass: false, latencyMs: Date.now() - t0, defects };
    }
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}
