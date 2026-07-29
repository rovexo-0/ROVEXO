/**
 * ROVEXO CLUSTER 8 — NOTIFICATIONS & EVENTS
 * SCOPE LOCK v1.0
 *
 * OWNER APPROVED · ARCHITECTURE SCOPE LOCKED
 * Cod Sânge — Cluster 8 · Owner Architecture Decision
 *
 * Equation:
 * Feature Event → emitSmartNotification → notification_events → preferences
 * → notifications → Inbox Hub → deliverNotificationChannels → Push / Email
 * = CLUSTER 8 v1.0 SCOPE LOCK
 *
 * Cod Sânge Cluster 8 — Architecture · Scope Lock · Technical Certification ·
 * Owner Visual QA · Production Freeze certified for v1.0.
 */

export const CLUSTER_8_NOTIFICATIONS_EVENTS_SCOPE_LOCK_V1 = {
  version: "1.0",
  cluster: "CLUSTER_8_NOTIFICATIONS_EVENTS",
  id: "cluster-8-notifications-events-scope-lock-v1",
  status: "OWNER_APPROVED_PRODUCTION_READY_FROZEN",
  approvedByOwner: true,
  scopeLocked: true,
  architectureCertified: true,
  productionReady: true,
  freezeApplied: true,
  technicalCertificationPass: true,
  ownerVisualQaPass: true,
  ownerVisualQa: "PASS" as const,
  productionStatus: "CERTIFIED" as const,

  equation:
    "FEATURE_EVENT + EMIT_SMART + IDEMPOTENCY + PREFERENCES + PERSISTENCE + INBOX_HUB + DELIVER + PUSH_EMAIL",

  eventAuthority: {
    emitSmartNotification: "SOLE_PUBLIC_RUNTIME_ENTRY",
    createNotification: "INTERNAL_PERSISTENCE_ONLY",
    dispatchNotification: "COMPATIBILITY_LAYER_ONLY",
  } as const,

  canonicalEventFlow: [
    "FEATURE_EVENT",
    "EMIT_SMART_NOTIFICATION",
    "NOTIFICATION_EVENTS_IDEMPOTENCY",
    "NOTIFICATION_PREFERENCES",
    "NOTIFICATIONS_PERSISTENCE",
    "INBOX_NOTIFICATIONS_HUB",
    "DELIVER_NOTIFICATION_CHANNELS",
    "PUSH_OR_EMAIL",
  ] as const,

  singularity: {
    authority: "lib/notifications/events.ts → emitSmartNotification",
    persistencePrimitive: "lib/notifications/create.ts → createNotification",
    compatibilityDispatch: "lib/notifications/dispatch.ts → dispatchNotification",
    preferences: "notification_preferences",
    preferencesCompatibility: "notification_settings",
    delivery: "lib/notifications/deliver.ts → deliverNotificationChannels",
    hubUi: "features/inbox/components/InboxPage.tsx",
    hubRoute: "/inbox?tab=notifications",
    catalog: "lib/notifications/catalog.ts",
    inboxEventEngine: "lib/inbox/inbox-event-engine-v1.ts",
  } as const,

  enabledV1: [
    "Inbox Notifications",
    "Notification Center",
    "Unread counters",
    "Mark as read",
    "Mark all as read",
    "Wallet notifications",
    "Offer notifications",
    "Message notifications",
    "Marketplace Follow notifications",
    "Admin broadcasts",
    "Push delivery",
    "Email delivery",
  ] as const,

  deferredToV1_1: [
    "Notification Delete UI",
    "Authentication notifications",
    "Spring 2 Transaction Hub events",
  ] as const,

  deferredGates: {
    notificationDeleteUi: {
      status: "DEFERRED_V1_1",
      apiExists: true,
      hubUiExists: false,
      note: "DELETE API may remain; Inbox Hub delete UI excluded from Cluster 8 certification",
    },
    authenticationNotifications: {
      status: "DEFERRED_V1_1",
      note: "No auth-login/session producers in v1.0 Scope Lock",
    },
    spring2TransactionHubEvents: {
      status: "DEFERRED_V1_1",
      ssot: "lib/inbox/transaction-hub-spring-2-v1.ts",
      note: "Requires Owner START SPRING 2 — out of Cluster 8 v1.0 freeze",
    },
  } as const,

  producers: {
    canonical: [
      "Orders",
      "Shipping",
      "Wallet",
      "Offers",
      "Messages",
      "Reviews",
      "Verification / Trust",
      "Marketplace Follow",
      "Admin broadcasts",
    ] as const,
    /** Cleared after Technical Certification producer migration. */
    migrationTargetsBeforeTechnicalCertification: [] as const,
  } as const,

  runtimeRules: {
    solePublicEntry: "emitSmartNotification",
    idempotencyMandatory: true,
    directDatabaseNotificationWritesForbidden: true,
    producerDirectCreateNotificationForbidden: true,
    producerDirectDispatchNotificationForbidden: true,
    directEmailBypassForbidden: true,
    socialFollowForbiddenForever: true,
  } as const,

  preferences: {
    canonical: "notification_preferences",
    compatibility: "notification_settings",
    secondAuthorityAfterCertificationForbidden: true,
  } as const,

  legacy: {
    dispatchNotification: {
      classification: "COMPATIBILITY",
      path: "lib/notifications/dispatch.ts",
      canonicalAfterCertification: false,
    },
    notificationSettings: {
      classification: "COMPATIBILITY",
      table: "notification_settings",
      canonicalAfterCertification: false,
    },
    producerCreateNotificationBypass: {
      classification: "LEGACY_PRODUCER",
      note: "Must migrate to emitSmartNotification before Technical Certification PASS",
      canonicalAfterCertification: false,
    },
    directQueueEmailBesideDeliver: {
      classification: "LEGACY_DELIVERY_BYPASS",
      note: "Canonical delivery is deliverNotificationChannels only",
      canonicalAfterCertification: false,
    },
    notificationsEngineAdmin: {
      classification: "ADMIN_CONFIG_ONLY",
      path: "lib/notifications-engine/*",
      note: "Super Admin config document — not runtime notification authority",
      canonicalRuntime: false,
    },
    socialFollowNotifications: {
      classification: "FORBIDDEN_FOREVER",
      note: "Social Follow permanently removed — marketplace follow notifs remain enabled",
    },
  } as const,

  permanentlyForbidden: [
    "Second public notification emit entry",
    "Producer calling createNotification directly",
    "Producer calling dispatchNotification directly",
    "Direct inserts into notifications without emitSmartNotification",
    "Second preference authority after certification",
    "Duplicate email delivery outside deliverNotificationChannels",
    "Social Follow notifications",
    "Promoting deferred v1.1 features into Cluster 8 certification without Owner approval",
  ] as const,

  nextGates: [] as const,

  technicalCertificationRequires: [
    "Migration targets emit via emitSmartNotification only",
    "No producer imports of createNotification or dispatchNotification",
    "No direct queueEmail bypass beside deliver for canonical order/message paths",
    "notification_preferences remains sole preference authority for emitSmart",
  ] as const,

  ssot: "lib/notifications/cluster-8-notifications-events-scope-lock-v1.ts",
} as const;

export type Cluster8NotificationsEventsScopeLockV1 =
  typeof CLUSTER_8_NOTIFICATIONS_EVENTS_SCOPE_LOCK_V1;

export function getCluster8NotificationsEventsScopeLockSnapshot() {
  return CLUSTER_8_NOTIFICATIONS_EVENTS_SCOPE_LOCK_V1;
}

export function assertCluster8NotificationsArchitectureOrBlock(): void {
  const lock = CLUSTER_8_NOTIFICATIONS_EVENTS_SCOPE_LOCK_V1;
  if (!lock.approvedByOwner || !lock.scopeLocked || !lock.architectureCertified) {
    throw new Error("CLUSTER 8 Notifications & Events Scope Lock is not Owner-approved.");
  }
  if (lock.eventAuthority.emitSmartNotification !== "SOLE_PUBLIC_RUNTIME_ENTRY") {
    throw new Error("CLUSTER 8 invariant broken: emitSmartNotification must be sole public entry.");
  }
  if (lock.preferences.canonical !== "notification_preferences") {
    throw new Error("CLUSTER 8 invariant broken: notification_preferences must be sole preference authority.");
  }
  if (!lock.runtimeRules.idempotencyMandatory) {
    throw new Error("CLUSTER 8 invariant broken: idempotency must be mandatory.");
  }
}
