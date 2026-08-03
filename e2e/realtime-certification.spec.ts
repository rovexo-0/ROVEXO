/**
 * ROVEXO Realtime Engine Certification v1.2 — full platform live evidence.
 * Independent latency per domain · NO proxy PASS · NO refresh · NO commit/push/preview/production.
 */
import { test, expect } from "@playwright/test";
import {
  REALTIME_CERT_ORIGIN,
  REALTIME_CERTIFICATION_VERSION,
  REALTIME_MAX_LATENCY_MS,
  evaluateRealtimeCertification,
  type RealtimeEvidenceSnapshot,
  type RealtimeWorkflowEvidence,
} from "../lib/realtime/realtime-certification-engine-v1";
import {
  auditArchitectureWorkflows,
  runLiveBadgeUnreadRealtime,
  runLiveMessageRealtime,
  writeRealtimeEvidence,
} from "./helpers/realtime-certification";
import {
  runLiveBundleRealtime,
  runLiveBuyerDashboardRealtime,
  runLiveFollowingRealtime,
  runLiveNotificationsRealtime,
  runLiveOfferAcceptRealtime,
  runLiveOfferCounterRealtime,
  runLiveOfferCreateRealtime,
  runLiveOfferDeclineRealtime,
  runLiveOrdersRealtime,
  runLiveReviewsRealtime,
  runLiveSearchRealtime,
  runLiveSellerDashboardRealtime,
  runLiveTrackingRealtime,
  runLiveWalletRealtime,
  type DomainLiveResult,
} from "./helpers/realtime-certification-domains-v1.2";

test.describe.configure({ mode: "serial" });

function applyLive(
  workflows: RealtimeWorkflowEvidence[],
  id: string,
  result: DomainLiveResult,
): void {
  const idx = workflows.findIndex((w) => w.id === id);
  if (idx < 0) return;
  workflows[idx] = {
    ...workflows[idx]!,
    live: result.pass && result.latencyMs != null ? "PASS" : "FAIL",
    latencyMs: result.latencyMs,
    defects: [...workflows[idx]!.defects, ...result.defects],
  };
}

test("Realtime Engine Certification v1.2 — full platform dual-browser", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(900_000);
  expect(baseURL).toBeTruthy();

  const workflows: RealtimeWorkflowEvidence[] = auditArchitectureWorkflows();
  const performance: Record<string, number | null> = {};

  let messageLive = {
    pass: false,
    latencyMs: null as number | null,
    badgeLatencyMs: null as number | null,
    defects: ["not executed"] as string[],
    conversationId: null as string | null,
  };

  try {
    messageLive = await runLiveMessageRealtime(browser, baseURL!);
    applyLive(workflows, "messages_send_receive", {
      pass:
        messageLive.defects.filter((d) => !d.includes("Inbox") && !d.includes("badge send"))
          .length === 0 && messageLive.latencyMs != null,
      latencyMs: messageLive.latencyMs,
      defects: messageLive.defects.filter(
        (d) => !d.includes("Inbox") && !d.includes("badge send"),
      ),
    });
    performance.messages = messageLive.latencyMs;

    const badgeLive = await runLiveBadgeUnreadRealtime(
      browser,
      baseURL!,
      messageLive.conversationId,
      {
        pass: messageLive.pass,
        badgeLatencyMs: messageLive.badgeLatencyMs,
        defects: messageLive.defects,
      },
    );
    applyLive(workflows, "messages_badge_unread", badgeLive);
    performance.inbox = badgeLive.latencyMs;

    const notifications = await runLiveNotificationsRealtime(browser, baseURL!);
    applyLive(workflows, "notifications_tray", notifications);
    performance.notifications = notifications.latencyMs;

    const offerCreate = await runLiveOfferCreateRealtime(browser, baseURL!);
    applyLive(workflows, "offers_create", offerCreate);
    performance.offers = offerCreate.latencyMs;

    const offerCounter = await runLiveOfferCounterRealtime(browser, baseURL!);
    applyLive(workflows, "offers_counter", offerCounter);
    performance.counter_offers = offerCounter.latencyMs;

    const offerAccept = await runLiveOfferAcceptRealtime(browser, baseURL!);
    applyLive(workflows, "offers_accept", offerAccept);
    performance.accept = offerAccept.latencyMs;

    const offerDecline = await runLiveOfferDeclineRealtime(browser, baseURL!);
    applyLive(workflows, "offers_decline", offerDecline);
    performance.decline = offerDecline.latencyMs;

    const bundle = await runLiveBundleRealtime(browser, baseURL!);
    applyLive(workflows, "bundle_checkout_buynow", bundle);
    performance.bundle = bundle.latencyMs;

    const orders = await runLiveOrdersRealtime(browser, baseURL!);
    applyLive(workflows, "orders_status", orders);
    performance.orders = orders.latencyMs;

    const tracking = await runLiveTrackingRealtime(browser, baseURL!);
    applyLive(workflows, "tracking_events", tracking);
    performance.tracking = tracking.latencyMs;

    const wallet = await runLiveWalletRealtime(browser, baseURL!);
    applyLive(workflows, "wallet_balance", wallet);
    performance.wallet = wallet.latencyMs;

    try {
      const following = await runLiveFollowingRealtime(browser, baseURL!);
      applyLive(workflows, "follow_counters", following);
      performance.following = following.latencyMs;
    } catch (error) {
      applyLive(workflows, "follow_counters", {
        pass: false,
        latencyMs: null,
        defects: [
          `Following runner threw: ${error instanceof Error ? error.message : String(error)}`,
        ],
      });
    }

    try {
      const search = await runLiveSearchRealtime(browser, baseURL!);
      applyLive(workflows, "search_visibility", search);
      performance.search = search.latencyMs;
    } catch (error) {
      applyLive(workflows, "search_visibility", {
        pass: false,
        latencyMs: null,
        defects: [`Search runner threw: ${error instanceof Error ? error.message : String(error)}`],
      });
    }

    try {
      const reviews = await runLiveReviewsRealtime(browser, baseURL!);
      applyLive(workflows, "reviews_scores", reviews);
      performance.reviews = reviews.latencyMs;
    } catch (error) {
      applyLive(workflows, "reviews_scores", {
        pass: false,
        latencyMs: null,
        defects: [`Reviews runner threw: ${error instanceof Error ? error.message : String(error)}`],
      });
    }

    try {
      const sellerDash = await runLiveSellerDashboardRealtime(browser, baseURL!);
      applyLive(workflows, "seller_dashboard", sellerDash);
      performance.seller_dashboard = sellerDash.latencyMs;
    } catch (error) {
      applyLive(workflows, "seller_dashboard", {
        pass: false,
        latencyMs: null,
        defects: [
          `Seller dashboard runner threw: ${error instanceof Error ? error.message : String(error)}`,
        ],
      });
    }

    try {
      const buyerDash = await runLiveBuyerDashboardRealtime(browser, baseURL!);
      applyLive(workflows, "buyer_dashboard", buyerDash);
      performance.buyer_dashboard = buyerDash.latencyMs;
    } catch (error) {
      applyLive(workflows, "buyer_dashboard", {
        pass: false,
        latencyMs: null,
        defects: [
          `Buyer dashboard runner threw: ${error instanceof Error ? error.message : String(error)}`,
        ],
      });
    }
  } finally {
    const cleanOverall = workflows.every(
      (w) => w.architecture === "PASS" && w.live === "PASS" && w.defects.length === 0,
    )
      ? "PASS"
      : "FAIL";

    const snapshot: RealtimeEvidenceSnapshot = {
      version: REALTIME_CERTIFICATION_VERSION,
      origin: REALTIME_CERT_ORIGIN,
      generatedAt: new Date().toISOString(),
      overall: cleanOverall,
      maxLatencyMs: REALTIME_MAX_LATENCY_MS,
      workflows,
      defects: [
        ...new Set(workflows.flatMap((w) => w.defects.map((d) => `${w.label}: ${d}`))),
      ],
      performance,
    };

    writeRealtimeEvidence(snapshot);

    const { pass, defects: evalDefects } = evaluateRealtimeCertification(snapshot);
    expect(pass, evalDefects.join(" | ") || `overall=${cleanOverall}`).toBe(true);
  }
});
