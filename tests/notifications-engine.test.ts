import { describe, expect, it } from "vitest";
import { createDefaultNotificationsEngineDocument } from "@/lib/notifications-engine/defaults";
import {
  NOTIFICATIONS_ENGINE_EVENTS,
  NOTIFICATIONS_ENGINE_FILTERS,
  NOTIFICATIONS_ENGINE_MODULES,
  NOTIFICATIONS_ENGINE_TEMPLATES,
  registerNotificationsEngineModule,
} from "@/lib/notifications-engine/registry";
import {
  derivePriority,
  mapLegacyTypeToEnterprise,
  mapNotificationToSummary,
  matchesSummaryFilter,
} from "@/lib/notifications-engine/timeline";
import { computeNotificationsAnalytics } from "@/lib/notifications-engine/reader";
import type { Notification } from "@/lib/notifications/types";

const sampleNotification = (overrides?: Partial<Notification>): Notification => ({
  id: "n1",
  type: "order",
  title: "Order confirmed",
  subtitle: "Your order #1234 has been placed",
  createdAt: "2026-06-01T12:00:00Z",
  read: false,
  href: "/orders/1234",
  icon: "order",
  ...overrides,
});

describe("notifications engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultNotificationsEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.notificationTypes.some((t) => t.id === "buyer" && t.enabled)).toBe(true);
    expect(doc.channels.some((c) => c.id === "push" && c.enabled)).toBe(true);
    expect(doc.integrations.ordersEngine).toBe(true);
    expect(doc.integrations.messagesEngine).toBe(true);
    expect(doc.adminAlerts.fraudAlerts).toBe(true);
  });

  it("registers all core notification modules", () => {
    const ids = NOTIFICATIONS_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("center");
    expect(ids).toContain("preferences");
    expect(ids).toContain("badges");
    expect(ids).toContain("analytics");
  });

  it("defines events, filters, and templates", () => {
    expect(NOTIFICATIONS_ENGINE_EVENTS.map((e) => e.id)).toContain("new-message");
    expect(NOTIFICATIONS_ENGINE_FILTERS.map((f) => f.id)).toContain("unread");
    expect(NOTIFICATIONS_ENGINE_TEMPLATES.map((t) => t.id)).toContain("protection");
  });

  it("maps legacy notification type to enterprise type", () => {
    expect(mapLegacyTypeToEnterprise("message")).toBe("buyer");
    expect(mapLegacyTypeToEnterprise("moderation")).toBe("administrator");
    expect(mapLegacyTypeToEnterprise("system")).toBe("system");
  });

  it("maps notification to summary", () => {
    const summary = mapNotificationToSummary(sampleNotification());
    expect(summary.enterpriseType).toBe("buyer");
    expect(summary.priority).toBe("important");
    expect(summary.filterTags).toContain("unread");
    expect(summary.filterTags).toContain("orders");
  });

  it("derives priority from notification type", () => {
    expect(derivePriority(sampleNotification({ type: "moderation" }))).toBe("critical");
    expect(derivePriority(sampleNotification({ type: "message" }))).toBe("information");
  });

  it("matches summary filters", () => {
    const summary = mapNotificationToSummary(sampleNotification());
    expect(matchesSummaryFilter(summary, "unread")).toBe(true);
    expect(matchesSummaryFilter(summary, "read")).toBe(false);
  });

  it("computes analytics from notifications", () => {
    const analytics = computeNotificationsAnalytics([
      sampleNotification(),
      sampleNotification({ id: "n2", read: true }),
    ]);
    expect(analytics.sent).toBe(2);
    expect(analytics.opened).toBe(1);
    expect(analytics.responseRate).toBe(0.5);
  });

  it("allows future module registration", () => {
    const next = registerNotificationsEngineModule({
      id: "custom-hub",
      label: "Custom Hub",
      icon: "🔔",
      description: "Future module",
      href: "/notifications",
    });
    expect(next.some((m) => m.id === "custom-hub")).toBe(true);
  });
});
