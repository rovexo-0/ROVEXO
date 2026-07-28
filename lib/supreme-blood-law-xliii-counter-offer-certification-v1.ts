/**
 * ROVEXO ABSOLUTE BLOOD LAW XLIII
 * COUNTER OFFER CERTIFICATION
 *
 * STATUS: SUPREME | LOCKED | FAIL CLOSED
 *
 * Mission: Deterministic Counter Offer — no silent failures, no generic errors,
 * UI ↔ Offer Engine ↔ Backend synchronized. FAIL CLOSED.
 *
 * Inbox UI sync architecture (canonical — certify this, nothing obsolete):
 * ConversationHub.tsx
 *   → dispatchEvent("rovexo:inbox-sync")
 * InboxPage.tsx
 *   → window.addEventListener / removeEventListener("rovexo:inbox-sync")
 * RealtimeNotificationProvider.tsx
 *   → window.addEventListener / removeEventListener("rovexo:inbox-sync")
 *   → UI Refresh
 *
 * Parents: Absolute Financial Law · Conversation Hub Master · Inbox Hub Master
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { workspacePath } from "@/lib/server/workspace-path";
import {
  COUNTER_OFFER_ENGINE_V1,
  COUNTER_OFFER_ERROR_COPY,
  encodeCounterOfferMessageMeta,
  mapOfferStatusToCounterError,
  parseCounterOfferMessageMeta,
  resolveOfferFromRole,
  type CounterOfferErrorCode,
} from "@/lib/offers/counter-offer-engine-v1";
import { mapOfferDbStatus } from "@/lib/inbox/conversation-view";

/**
 * Canonical certification file targets — one object, no duplicated path strings.
 * Inbox sync certifies ConversationHub → InboxPage → RealtimeNotificationProvider.
 * Never certify app/inbox/page.tsx or BadgeProvider (deleted / thin route only).
 */
export const CERTIFICATION_TARGETS = {
  conversationHub: "features/inbox/components/ConversationHub.tsx",
  inboxPage: "features/inbox/components/InboxPage.tsx",
  notificationProvider: "features/notifications/components/RealtimeNotificationProvider.tsx",
  counterOfferEngine: "lib/offers/counter-offer-engine-v1.ts",
  offersApi: "app/api/offers/[id]/route.ts",
  offersListApi: "app/api/offers/route.ts",
  inboxEventEngine: "lib/inbox/inbox-event-engine-v1.ts",
  messagesApi: "app/api/messages/[id]/route.ts",
  inboxSyncMigration: "supabase/migrations/20260725160000_inbox_event_engine_sync_open_xliii.sql",
  instrumentation: "instrumentation.ts",
} as const;

export const SUPREME_BLOOD_LAW_XLIII_COUNTER_OFFER_CERTIFICATION_V1 = {
  version: "1.1",
  bloodLaw: "XLIII",
  name: "Counter Offer Certification + Inbox Event Engine Singularity",
  status: "SUPREME_LOCKED_FAIL_CLOSED",
  supreme: true,
  locked: true,
  equation:
    "ONE_OFFER_STATE = ONE_INBOX_EVENT = ONE_UNREAD = ONE_BADGE = ONE_UI = ONE_BACKEND = FAIL_CLOSED",
  mission:
    "Completely certify the Counter Offer engine AND Inbox Event Engine singularity. Deterministic state machine. No desync. No generic errors. No separate message/notification/badge state.",
  certificationTargets: CERTIFICATION_TARGETS,
  inboxEventEngine: {
    path: CERTIFICATION_TARGETS.inboxEventEngine,
    rpc: "sync_conversation_open_v1",
    migration: CERTIFICATION_TARGETS.inboxSyncMigration,
    clientBroadcast: "rovexo:inbox-sync",
    uiArchitecture: [
      "ConversationHub.dispatchEvent(rovexo:inbox-sync)",
      "InboxPage.addEventListener(rovexo:inbox-sync)",
      "InboxPage.removeEventListener(rovexo:inbox-sync)",
      "RealtimeNotificationProvider.addEventListener(rovexo:inbox-sync)",
      "RealtimeNotificationProvider.removeEventListener(rovexo:inbox-sync)",
    ] as const,
    syncOnOpenSources: [
      "notification",
      "offer",
      "counter_offer",
      "accepted_offer",
      "declined_offer",
      "order",
      "tracking",
      "messages_tab",
      "hub_mount",
      "hub_focus",
    ] as const,
  },
  certifiedStateMachine: [
    "Pending → Accepted → Checkout → Completed",
    "Pending → Countered → Buyer Decision → Accepted | Declined",
    "Pending → Declined → Closed",
    "Pending → Expired → Closed",
    "Pending → Cancelled → Closed",
  ] as const,
  explicitErrorCodes: [
    "OFFER_EXPIRED",
    "OFFER_ALREADY_ACCEPTED",
    "OFFER_ALREADY_DECLINED",
    "OFFER_CANCELLED",
    "OFFER_ALREADY_COUNTERED",
    "OFFER_LOCKED",
    "OFFER_VERSION_MISMATCH",
    "OFFER_AMOUNT_INVALID",
    "PERMISSION_DENIED",
    "DATABASE_UPDATE_FAILED",
  ] as const,
  forbiddenGenericErrors: ["Unable to counter offer."] as const,
  enginePath: CERTIFICATION_TARGETS.counterOfferEngine,
  apiPath: CERTIFICATION_TARGETS.offersApi,
  hubPath: CERTIFICATION_TARGETS.conversationHub,
} as const;

export type CounterOfferCertificationGate = {
  id: string;
  label: string;
  pass: boolean;
  detail?: string;
};

export type CounterOfferCertificationReport = {
  bloodLaw: "XLIII";
  ok: boolean;
  certified: boolean;
  productionReady: boolean;
  gates: CounterOfferCertificationGate[];
  errors: string[];
};

function readWorkspace(relativePath: string): string | null {
  const absolute = workspacePath(relativePath);
  if (!existsSync(absolute)) return null;
  return readFileSync(absolute, "utf8");
}

function gate(id: string, label: string, pass: boolean, detail?: string): CounterOfferCertificationGate {
  return { id, label, pass, detail };
}

function requireSource(
  gates: CounterOfferCertificationGate[],
  id: string,
  missingLabel: string,
  relativePath: string,
): string | null {
  const source = readWorkspace(relativePath);
  if (source == null) {
    gates.push(gate(id, missingLabel, false, relativePath));
    return null;
  }
  return source;
}

/** Static + contract certification (runtime E2E is Owner / Playwright). */
export function certifyCounterOfferXliii(): CounterOfferCertificationReport {
  const errors: string[] = [];
  const gates: CounterOfferCertificationGate[] = [];

  const engine = requireSource(
    gates,
    "engine-file",
    "Counter Offer Engine file missing",
    CERTIFICATION_TARGETS.counterOfferEngine,
  );
  const api = requireSource(
    gates,
    "offers-api-file",
    "Offers API file missing",
    CERTIFICATION_TARGETS.offersApi,
  );
  const hub = requireSource(
    gates,
    "conversation-hub-file",
    "ConversationHub file missing",
    CERTIFICATION_TARGETS.conversationHub,
  );
  const offersGet = requireSource(
    gates,
    "offers-list-api-file",
    "Offers list API file missing",
    CERTIFICATION_TARGETS.offersListApi,
  );
  const instrumentation = requireSource(
    gates,
    "instrumentation-file",
    "instrumentation.ts file missing",
    CERTIFICATION_TARGETS.instrumentation,
  );

  if (engine) {
    gates.push(
      gate(
        "engine",
        "Counter Offer Engine SSOT exists",
        engine.includes("executeCounterOffer") &&
          engine.includes("OFFER_ALREADY_COUNTERED") &&
          COUNTER_OFFER_ENGINE_V1.bloodLaw === "XLIII",
      ),
    );
  }

  if (api && hub) {
    gates.push(
      gate(
        "no-generic-error",
        "Generic 'Unable to counter offer.' removed",
        !api.includes("Unable to counter offer.") && !hub.includes("Unable to counter offer."),
      ),
    );
  }

  const explicitCodes = SUPREME_BLOOD_LAW_XLIII_COUNTER_OFFER_CERTIFICATION_V1.explicitErrorCodes.every(
    (code) => code in COUNTER_OFFER_ERROR_COPY && Boolean(COUNTER_OFFER_ERROR_COPY[code as CounterOfferErrorCode]),
  );
  gates.push(gate("explicit-errors", "Explicit Counter Offer error copy map", explicitCodes));

  if (engine && api) {
    const atomic =
      engine.includes('eq("status", "pending")') &&
      engine.includes("Restore parent") &&
      api.includes("executeCounterOffer");
    gates.push(gate("atomic-counter", "Atomic cancel + insert with restore on failure", atomic));

    gates.push(
      gate(
        "seller-counter-rls",
        "Seller counter uses admin insert after authz (buyer-only RLS bypass)",
        engine.includes("createAdminClient") && engine.includes("PERMISSION_DENIED"),
      ),
    );
  }

  if (hub) {
    /** Current Hub fail-closed Counter Offer UI — no obsolete canActOnOffer symbol. */
    const uiSync =
      hub.includes('expectedStatus: "pending"') &&
      hub.includes("Counter Sent · Waiting for Buyer") &&
      hub.includes('data-blood-law="XLIII"') &&
      hub.includes("payload.code") &&
      hub.includes("reloadRelated") &&
      hub.includes("OFFER_ALREADY_COUNTERED");
    gates.push(
      gate(
        "ui-sync",
        "Conversation Hub fail-closed UI sync",
        uiSync,
        uiSync ? undefined : "ConversationHub missing fail-closed Counter Offer UI sync contracts",
      ),
    );
  }

  if (offersGet && api) {
    gates.push(
      gate(
        "from-role",
        "GET/PATCH expose fromRole + parentOfferId",
        offersGet.includes("resolveOfferFromRole") &&
          offersGet.includes("parentOfferId") &&
          api.includes("resolveOfferFromRole"),
      ),
    );

    gates.push(
      gate(
        "buyer-accept-counter",
        "Buyer may accept seller counter",
        api.includes('fromRole === "seller" && offer.buyer_id === user.id') &&
          api.includes("canAccept"),
      ),
    );
  }

  if (api && hub) {
    gates.push(
      gate(
        "notification-deep-link",
        "Counter notification deep-links + highlight",
        api.includes("focus=counter") && hub.includes("highlightOfferId"),
      ),
    );
  }

  const statusMap =
    mapOfferDbStatus("cancelled") === "countered" &&
    mapOfferDbStatus("pending") === "open" &&
    mapOfferDbStatus("rejected") === "declined";
  gates.push(gate("status-map", "Cancelled parent maps to countered UI state", statusMap));

  const metaRoundTrip = (() => {
    const encoded = encodeCounterOfferMessageMeta(
      "seller",
      "11111111-1111-1111-1111-111111111111",
      "hello",
    );
    const parsed = parseCounterOfferMessageMeta(encoded);
    return (
      parsed.fromRole === "seller" &&
      parsed.parentOfferId === "11111111-1111-1111-1111-111111111111" &&
      resolveOfferFromRole({
        buyerId: "buyer",
        message: encoded,
      }) === "seller"
    );
  })();
  gates.push(gate("message-meta", "Counter message meta encode/parse", metaRoundTrip));

  const statusErrors =
    mapOfferStatusToCounterError("accepted") === "OFFER_ALREADY_ACCEPTED" &&
    mapOfferStatusToCounterError("rejected") === "OFFER_ALREADY_DECLINED" &&
    mapOfferStatusToCounterError("expired") === "OFFER_EXPIRED" &&
    mapOfferStatusToCounterError("cancelled") === "OFFER_CANCELLED";
  gates.push(gate("status-error-map", "Status → explicit error code map", statusErrors));

  if (instrumentation) {
    gates.push(
      gate(
        "instrumentation",
        "Startup gate wired",
        instrumentation.includes("assertCounterOfferCertificationOrBlock"),
      ),
    );
  }

  const inboxEngine = requireSource(
    gates,
    "inbox-event-engine-file",
    "Inbox Event Engine file missing",
    CERTIFICATION_TARGETS.inboxEventEngine,
  );
  const messagesApi = requireSource(
    gates,
    "messages-api-file",
    "Messages API file missing",
    CERTIFICATION_TARGETS.messagesApi,
  );
  const inboxPage = requireSource(
    gates,
    "inbox-page-file",
    "InboxPage file missing",
    CERTIFICATION_TARGETS.inboxPage,
  );
  const notificationProvider = requireSource(
    gates,
    "notification-provider-file",
    "Notification Provider file missing",
    CERTIFICATION_TARGETS.notificationProvider,
  );
  const migration = requireSource(
    gates,
    "inbox-sync-migration-file",
    "Inbox sync migration file missing",
    CERTIFICATION_TARGETS.inboxSyncMigration,
  );

  if (inboxEngine) {
    gates.push(
      gate(
        "inbox-event-engine",
        "Inbox Event Engine SSOT exists",
        inboxEngine.includes("syncConversationOpen") &&
          inboxEngine.includes("INBOX_EVENT_ENGINE_V1") &&
          inboxEngine.includes("rovexo:inbox-sync"),
      ),
    );
    gates.push(
      gate(
        "no-message-only-notif-clear",
        "Open sync marks all conversation-scoped notifications (not message-type only)",
        inboxEngine.includes("isConversationScopedHref") &&
          !inboxEngine.includes('.eq("type", "message")'),
      ),
    );
  }

  if (migration) {
    gates.push(
      gate(
        "inbox-sync-rpc",
        "Postgres single-transaction sync_conversation_open_v1",
        migration.includes("sync_conversation_open_v1") &&
          migration.includes("for update") &&
          migration.includes("notifications"),
      ),
    );
  }

  if (messagesApi) {
    gates.push(
      gate(
        "inbox-sync-api",
        "PATCH /api/messages/[id] read uses Inbox Event Engine",
        messagesApi.includes("syncConversationOpen") &&
          messagesApi.includes('bloodLaw: "XLIII"'),
      ),
    );
  }

  /* ── Inbox UI sync architecture (CURRENT production only) ─────────────── */

  if (hub) {
    const hubDispatch =
      hub.includes('new CustomEvent("rovexo:inbox-sync"') ||
      hub.includes("new CustomEvent('rovexo:inbox-sync'");
    gates.push(
      gate(
        "hub-inbox-sync-dispatch",
        "ConversationHub missing inbox sync dispatch",
        hubDispatch,
      ),
    );
  }

  if (inboxPage) {
    const inboxRegisters =
      inboxPage.includes('addEventListener("rovexo:inbox-sync"') ||
      inboxPage.includes("addEventListener('rovexo:inbox-sync'");
    const inboxUnregisters =
      inboxPage.includes('removeEventListener("rovexo:inbox-sync"') ||
      inboxPage.includes("removeEventListener('rovexo:inbox-sync'");
    gates.push(
      gate(
        "inbox-page-listener-register",
        "InboxPage missing listener registration",
        inboxRegisters,
      ),
    );
    gates.push(
      gate(
        "inbox-page-listener-cleanup",
        "InboxPage missing listener cleanup",
        inboxUnregisters,
      ),
    );
  }

  if (notificationProvider) {
    const providerRegisters =
      notificationProvider.includes('addEventListener("rovexo:inbox-sync"') ||
      notificationProvider.includes("addEventListener('rovexo:inbox-sync'");
    const providerUnregisters =
      notificationProvider.includes('removeEventListener("rovexo:inbox-sync"') ||
      notificationProvider.includes("removeEventListener('rovexo:inbox-sync'");
    gates.push(
      gate(
        "notification-provider-listener-register",
        "RealtimeNotificationProvider missing listener registration",
        providerRegisters,
      ),
    );
    gates.push(
      gate(
        "notification-provider-listener-cleanup",
        "RealtimeNotificationProvider missing listener cleanup",
        providerUnregisters,
      ),
    );
  }

  if (hub && inboxPage && notificationProvider) {
    const hubReadAction = hub.includes('action: "read"') || hub.includes("action: 'read'");
    gates.push(
      gate(
        "inbox-sync-ui",
        "Hub + InboxPage + RealtimeNotificationProvider share rovexo:inbox-sync",
        hub.includes("rovexo:inbox-sync") &&
          hubReadAction &&
          inboxPage.includes("rovexo:inbox-sync") &&
          notificationProvider.includes("rovexo:inbox-sync"),
      ),
    );
  }

  for (const g of gates) {
    if (!g.pass) {
      // Prefer exact contract labels (already written as failure copy for UI sync gates).
      errors.push(g.detail ? `${g.label} (${g.detail})` : g.label);
    }
  }

  const ok = gates.every((g) => g.pass);
  return {
    bloodLaw: "XLIII",
    ok,
    certified: ok,
    /** Production Ready requires Owner runtime E2E evidence — static cert alone is not enough. */
    productionReady: false,
    gates,
    errors,
  };
}

export function assertCounterOfferCertificationOrBlock(): void {
  const report = certifyCounterOfferXliii();
  if (!report.ok) {
    throw new Error(
      `[BLOOD XLIII] Counter Offer Certification FAILED — BLOCK LOADING. ${report.errors.join("; ")}`,
    );
  }
}

export function assertCounterOfferProductionReleaseOrBlock(input: {
  runtimeE2eEvidencePass: boolean;
}): void {
  assertCounterOfferCertificationOrBlock();
  if (!input.runtimeE2eEvidencePass) {
    throw new Error(
      "[BLOOD XLIII] Counter Offer NOT CERTIFIED for production — runtime E2E evidence required. BLOCK PRODUCTION.",
    );
  }
}
