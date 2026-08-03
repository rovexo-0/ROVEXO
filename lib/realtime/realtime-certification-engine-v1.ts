/**
 * ROVEXO REALTIME ENGINE CERTIFICATION v1.2
 *
 * STATUS: FINAL PREVIEW BLOCKER · COD SÂNGE · OWNER ABSOLUTE
 * HOST: http://localhost:3000 ONLY (agent may use Playwright-managed mirror)
 *
 * FAIL if refresh/F5/manual navigation/polling/cache delay is required.
 * FAIL if any domain lacks independent live latency evidence.
 * Proxy PASS forbidden. Evidence only · NO commit · NO push · NO Preview · NO Production.
 */
import { CURSOR_LOCAL_ORIGIN } from "@/lib/preview/owner-preview-ssot";

export const REALTIME_CERTIFICATION_ID = "REALTIME_ENGINE_CERTIFICATION" as const;
export const REALTIME_CERTIFICATION_VERSION = "v1.2" as const;
export const REALTIME_CERTIFICATION_STATUS =
  "FINAL PREVIEW BLOCKER · COD SÂNGE · OWNER ABSOLUTE · v1.2 FULL PLATFORM" as const;
export const REALTIME_CERT_ORIGIN = CURSOR_LOCAL_ORIGIN;

export const REALTIME_EVIDENCE_DIR = "test-results/realtime-certification-v1";

/** Max wait for dual-browser live appear without refresh (ms). */
export const REALTIME_MAX_LATENCY_MS = 8_000 as const;

export const REALTIME_ROLES = [
  "buyer",
  "seller",
  "admin",
  "business",
  "super_admin",
] as const;

export type RealtimeRole = (typeof REALTIME_ROLES)[number];

export const REALTIME_DOMAINS = [
  "messages",
  "notifications",
  "offers",
  "bundle",
  "buy_now",
  "checkout",
  "orders",
  "tracking",
  "wallet",
  "reviews",
  "follow",
  "profile",
  "search",
  "seller_dashboard",
  "buyer_dashboard",
] as const;

export type RealtimeDomain = (typeof REALTIME_DOMAINS)[number];

export type RealtimeWorkflowSpec = {
  id: string;
  domain: RealtimeDomain;
  label: string;
  architecturePaths: readonly string[];
  requiredMarkers: readonly string[];
  forbiddenMarkers?: readonly string[];
  /** v1.2 — every platform domain requires independent live evidence. */
  liveRequired: true;
};

export const REALTIME_WORKFLOWS: readonly RealtimeWorkflowSpec[] = [
  {
    id: "messages_send_receive",
    domain: "messages",
    label: "Messages",
    architecturePaths: [
      "lib/messages/realtime.ts",
      "lib/inbox/conversation-realtime.ts",
      "features/messages/hooks/use-chat-realtime.ts",
      "features/inbox/components/ConversationHub.tsx",
    ],
    requiredMarkers: [
      "postgres_changes",
      "subscribeToConversationMessages",
      "subscribeConversationRealtime",
    ],
    liveRequired: true,
  },
  {
    id: "messages_badge_unread",
    domain: "messages",
    label: "Inbox",
    architecturePaths: [
      "lib/inbox/realtime.ts",
      "lib/inbox/conversation-unread-realtime.ts",
      "features/notifications/components/RealtimeNotificationProvider.tsx",
      "features/inbox/components/InboxPage.tsx",
      "lib/inbox/inbox-event-engine-v1.ts",
    ],
    requiredMarkers: [
      "subscribeInboxRealtime",
      "subscribeToUserConversationUnread",
      "rovexo:inbox-sync",
      "syncConversationOpen",
    ],
    liveRequired: true,
  },
  {
    id: "notifications_tray",
    domain: "notifications",
    label: "Notifications",
    architecturePaths: [
      "lib/notifications/realtime.ts",
      "features/notifications/components/RealtimeNotificationProvider.tsx",
    ],
    requiredMarkers: ["postgres_changes", "subscribeToUserNotifications"],
    liveRequired: true,
  },
  {
    id: "offers_create",
    domain: "offers",
    label: "Offers",
    architecturePaths: [
      "lib/inbox/conversation-realtime.ts",
      "features/inbox/components/ConversationHub.tsx",
    ],
    requiredMarkers: ["offer.updated", "postgres_changes"],
    liveRequired: true,
  },
  {
    id: "offers_counter",
    domain: "offers",
    label: "Counter Offers",
    architecturePaths: [
      "lib/inbox/conversation-realtime.ts",
      "lib/supreme-blood-law-xliii-counter-offer-certification-v1.ts",
      "features/inbox/components/ConversationHub.tsx",
    ],
    requiredMarkers: ["offer.updated", "postgres_changes"],
    liveRequired: true,
  },
  {
    id: "offers_accept",
    domain: "offers",
    label: "Accept",
    architecturePaths: [
      "lib/inbox/conversation-realtime.ts",
      "features/inbox/components/ConversationHub.tsx",
    ],
    requiredMarkers: ["offer.updated", "postgres_changes"],
    liveRequired: true,
  },
  {
    id: "offers_decline",
    domain: "offers",
    label: "Decline",
    architecturePaths: [
      "lib/inbox/conversation-realtime.ts",
      "features/inbox/components/ConversationHub.tsx",
    ],
    requiredMarkers: ["offer.updated", "postgres_changes"],
    liveRequired: true,
  },
  {
    id: "bundle_checkout_buynow",
    domain: "bundle",
    label: "Bundle",
    architecturePaths: [
      "lib/inbox/conversation-realtime.ts",
      "features/notifications/components/RealtimeNotificationProvider.tsx",
    ],
    requiredMarkers: ["order.updated", "offer.updated", "postgres_changes"],
    liveRequired: true,
  },
  {
    id: "orders_status",
    domain: "orders",
    label: "Orders",
    architecturePaths: [
      "lib/orders/orders-realtime.ts",
      "features/orders/components/OrdersPage.tsx",
      "lib/inbox/conversation-realtime.ts",
    ],
    requiredMarkers: ["subscribeOrdersRealtime", "postgres_changes"],
    liveRequired: true,
  },
  {
    id: "tracking_events",
    domain: "tracking",
    label: "Tracking",
    architecturePaths: ["lib/inbox/conversation-realtime.ts"],
    requiredMarkers: ["tracking.updated", "postgres_changes"],
    liveRequired: true,
  },
  {
    id: "wallet_balance",
    domain: "wallet",
    label: "Wallet",
    architecturePaths: [
      "lib/account-center/realtime.ts",
      "features/wallet/hooks/use-wallet-live.ts",
      "features/wallet/components/WalletHubV1.tsx",
    ],
    requiredMarkers: ["wallets", "wallet_transactions", "postgres_changes"],
    liveRequired: true,
  },
  {
    id: "follow_counters",
    domain: "follow",
    label: "Following",
    architecturePaths: [
      "lib/realtime/following-feed-realtime.ts",
      "features/home/components/FollowingFeedSection.tsx",
    ],
    requiredMarkers: ["subscribeFollowingFeedRealtime", "postgres_changes"],
    forbiddenMarkers: ["setInterval(", "45_000", "45000"],
    liveRequired: true,
  },
  {
    id: "search_visibility",
    domain: "search",
    label: "Search",
    architecturePaths: [
      "lib/realtime/search-listings-realtime.ts",
      "features/search/components/SearchResultsView.tsx",
    ],
    requiredMarkers: ["subscribeSearchListingsRealtime", "postgres_changes"],
    liveRequired: true,
  },
  {
    id: "reviews_scores",
    domain: "reviews",
    label: "Reviews",
    architecturePaths: ["lib/account-center/realtime.ts"],
    requiredMarkers: ["reviews", "postgres_changes"],
    liveRequired: true,
  },
  {
    id: "seller_dashboard",
    domain: "seller_dashboard",
    label: "Seller Dashboard",
    architecturePaths: [
      "lib/account-center/realtime.ts",
      "features/account-center/hooks/useAccountHubLive.ts",
    ],
    requiredMarkers: ["subscribeToAccountHubStats", "postgres_changes"],
    liveRequired: true,
  },
  {
    id: "buyer_dashboard",
    domain: "buyer_dashboard",
    label: "Buyer Dashboard",
    architecturePaths: [
      "lib/account-center/realtime.ts",
      "features/account-center/hooks/useAccountHubLive.ts",
    ],
    requiredMarkers: ["subscribeToAccountHubStats", "postgres_changes"],
    liveRequired: true,
  },
] as const;

export const REALTIME_CERTIFICATION_CONTRACT = {
  id: REALTIME_CERTIFICATION_ID,
  version: REALTIME_CERTIFICATION_VERSION,
  status: REALTIME_CERTIFICATION_STATUS,
  origin: REALTIME_CERT_ORIGIN,
  maxLatencyMs: REALTIME_MAX_LATENCY_MS,
  domainCount: REALTIME_DOMAINS.length,
  workflowCount: REALTIME_WORKFLOWS.length,
  roles: REALTIME_ROLES,
  mandatoryBeforePreviewRelease: true,
  failConditions: [
    "refresh_required",
    "f5_required",
    "manual_navigation_required",
    "polling_delay",
    "cache_delay",
    "badge_delay",
    "notification_delay",
    "conversation_delay",
    "offer_delay",
    "proxy_pass",
    "missing_live_latency",
  ] as const,
  forbidden: [
    "fake_pass",
    "optimistic_pass",
    "proxy_pass",
    "commit",
    "push",
    "preview",
    "production",
  ] as const,
} as const;

export type RealtimeCellResult = "PASS" | "FAIL" | "SKIP" | "UNVERIFIED";

export type RealtimeWorkflowEvidence = {
  id: string;
  domain: RealtimeDomain;
  label: string;
  architecture: RealtimeCellResult;
  live: RealtimeCellResult;
  latencyMs: number | null;
  defects: string[];
};

export type RealtimeEvidenceSnapshot = {
  version: typeof REALTIME_CERTIFICATION_VERSION;
  origin: string;
  generatedAt: string;
  overall: RealtimeCellResult;
  maxLatencyMs: typeof REALTIME_MAX_LATENCY_MS;
  workflows: RealtimeWorkflowEvidence[];
  defects: string[];
  performance: Record<string, number | null>;
};

export function evaluateRealtimeCertification(
  evidence: RealtimeEvidenceSnapshot,
): { pass: boolean; defects: string[] } {
  const defects = [...evidence.defects];
  for (const workflow of evidence.workflows) {
    if (workflow.architecture === "FAIL") {
      defects.push(
        `${workflow.label}: architecture FAIL — ${workflow.defects.join("; ") || "FAIL"}`,
      );
    }
    if (workflow.live === "FAIL") {
      defects.push(`${workflow.label}: live FAIL — ${workflow.defects.join("; ") || "FAIL"}`);
    }
    if (workflow.live === "SKIP" || workflow.live === "UNVERIFIED") {
      defects.push(`${workflow.label}: live evidence required (v1.2 forbids SKIP/proxy)`);
    }
    if (workflow.live === "PASS" && (workflow.latencyMs == null || workflow.latencyMs < 0)) {
      defects.push(`${workflow.label}: measured live latency required`);
    }
    if (
      workflow.live === "PASS" &&
      workflow.latencyMs != null &&
      workflow.latencyMs > REALTIME_MAX_LATENCY_MS
    ) {
      defects.push(
        `${workflow.label}: latency ${workflow.latencyMs}ms exceeds ${REALTIME_MAX_LATENCY_MS}ms`,
      );
    }
  }
  const unique = [...new Set(defects)];
  return {
    pass: unique.length === 0 && evidence.overall === "PASS",
    defects: unique,
  };
}

export function assertRealtimeCertificationOrBlock(
  evidence: RealtimeEvidenceSnapshot,
): RealtimeEvidenceSnapshot {
  const { pass, defects } = evaluateRealtimeCertification(evidence);
  if (!pass) {
    throw new Error(
      `[REALTIME CERTIFICATION] BLOCKED — ${defects.slice(0, 12).join(" | ")}${
        defects.length > 12 ? ` (+${defects.length - 12} more)` : ""
      }`,
    );
  }
  return evidence;
}

export function emptyRealtimeEvidence(): RealtimeEvidenceSnapshot {
  return {
    version: REALTIME_CERTIFICATION_VERSION,
    origin: REALTIME_CERT_ORIGIN,
    generatedAt: new Date().toISOString(),
    overall: "UNVERIFIED",
    maxLatencyMs: REALTIME_MAX_LATENCY_MS,
    workflows: REALTIME_WORKFLOWS.map((workflow) => ({
      id: workflow.id,
      domain: workflow.domain,
      label: workflow.label,
      architecture: "UNVERIFIED",
      live: "UNVERIFIED",
      latencyMs: null,
      defects: ["No runtime evidence"],
    })),
    defects: ["Realtime Certification has not been executed"],
    performance: {},
  };
}
