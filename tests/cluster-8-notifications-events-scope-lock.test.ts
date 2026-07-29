import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLUSTER_8_NOTIFICATIONS_EVENTS_SCOPE_LOCK_V1,
  assertCluster8NotificationsArchitectureOrBlock,
} from "@/lib/notifications/cluster-8-notifications-events-scope-lock-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Cluster 8 Notifications & Events Scope Lock", () => {
  const lock = CLUSTER_8_NOTIFICATIONS_EVENTS_SCOPE_LOCK_V1;

  it("is Owner-approved architecture Scope Locked (not Production Freeze)", () => {
    expect(lock.approvedByOwner).toBe(true);
    expect(lock.scopeLocked).toBe(true);
    expect(lock.architectureCertified).toBe(true);
    expect(lock.cluster).toBe("CLUSTER_8_NOTIFICATIONS_EVENTS");
    expect(lock.productionReady).toBe(true);
    expect(lock.freezeApplied).toBe(true);
    expect(lock.technicalCertificationPass).toBe(true);
    expect(lock.ownerVisualQaPass).toBe(true);
    expect(lock.ownerVisualQa).toBe("PASS");
    expect(lock.productionStatus).toBe("CERTIFIED");
    expect(lock.eventAuthority.emitSmartNotification).toBe("SOLE_PUBLIC_RUNTIME_ENTRY");
    expect(lock.eventAuthority.createNotification).toBe("INTERNAL_PERSISTENCE_ONLY");
    expect(lock.eventAuthority.dispatchNotification).toBe("COMPATIBILITY_LAYER_ONLY");
    expect(lock.canonicalEventFlow).toEqual([
      "FEATURE_EVENT",
      "EMIT_SMART_NOTIFICATION",
      "NOTIFICATION_EVENTS_IDEMPOTENCY",
      "NOTIFICATION_PREFERENCES",
      "NOTIFICATIONS_PERSISTENCE",
      "INBOX_NOTIFICATIONS_HUB",
      "DELIVER_NOTIFICATION_CHANNELS",
      "PUSH_OR_EMAIL",
    ]);
    expect(lock.deferredToV1_1).toContain("Notification Delete UI");
    expect(lock.deferredToV1_1).toContain("Authentication notifications");
    expect(lock.deferredToV1_1).toContain("Spring 2 Transaction Hub events");
    expect(lock.preferences.canonical).toBe("notification_preferences");
    expect(lock.preferences.compatibility).toBe("notification_settings");
    assertCluster8NotificationsArchitectureOrBlock();
  });

  it("locks emitSmartNotification as authority with idempotency + deliver", () => {
    const events = readSource("lib/notifications/events.ts");
    expect(events).toContain("export async function emitSmartNotification");
    expect(events).toContain("idempotencyKey");
    expect(events).toContain("notification_events");
    expect(events).toContain("notification_preferences");
    expect(events).toContain("createNotification");
    expect(events).toContain("deliverNotificationChannels");

    const create = readSource("lib/notifications/create.ts");
    expect(create).toContain("export async function createNotification");

    const dispatch = readSource("lib/notifications/dispatch.ts");
    expect(dispatch).toContain("export async function dispatchNotification");
    expect(dispatch).toContain("notification_settings");
  });

  it("keeps Notification Center on Inbox Hub and excludes Delete UI from hub", () => {
    const canonical = readSource("lib/notifications/canonical.ts");
    expect(canonical).toContain("/inbox?tab=notifications");

    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    expect(inbox).toContain("Mark all read");
    expect(inbox).not.toMatch(/deleteNotification|Delete all|Clear read/i);

    expect(lock.deferredGates.notificationDeleteUi.hubUiExists).toBe(false);
    expect(lock.deferredGates.spring2TransactionHubEvents.status).toBe("DEFERRED_V1_1");
  });

  it("records producers as canonical after Technical Certification migration", () => {
    expect(lock.producers.canonical).toEqual(
      expect.arrayContaining([
        "Orders",
        "Shipping",
        "Wallet",
        "Offers",
        "Messages",
        "Reviews",
        "Verification / Trust",
        "Marketplace Follow",
        "Admin broadcasts",
      ]),
    );
    expect(lock.producers.migrationTargetsBeforeTechnicalCertification).toEqual([]);
    expect(lock.technicalCertificationRequires.length).toBeGreaterThan(0);
    expect(lock.runtimeRules.idempotencyMandatory).toBe(true);
    expect(lock.runtimeRules.producerDirectCreateNotificationForbidden).toBe(true);
  });

  it("classifies legacy dispatch + settings as non-canonical after certification", () => {
    expect(lock.legacy.dispatchNotification.classification).toBe("COMPATIBILITY");
    expect(lock.legacy.dispatchNotification.canonicalAfterCertification).toBe(false);
    expect(lock.legacy.notificationSettings.classification).toBe("COMPATIBILITY");
    expect(lock.legacy.socialFollowNotifications.classification).toBe("FORBIDDEN_FOREVER");
    expect(lock.legacy.notificationsEngineAdmin.canonicalRuntime).toBe(false);
  });
});
