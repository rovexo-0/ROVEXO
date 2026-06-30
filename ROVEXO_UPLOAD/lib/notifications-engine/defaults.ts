import {
  NOTIFICATIONS_ENGINE_BADGE_SURFACES,
  NOTIFICATIONS_ENGINE_CHANNELS,
  NOTIFICATIONS_ENGINE_EVENTS,
  NOTIFICATIONS_ENGINE_FILTERS,
  NOTIFICATIONS_ENGINE_PRIORITIES,
  NOTIFICATIONS_ENGINE_TEMPLATES,
  NOTIFICATIONS_ENGINE_TYPES,
} from "@/lib/notifications-engine/registry";
import type { NotificationsEngineDocument, NotificationsEngineHistoryEntry } from "@/lib/notifications-engine/types";

const now = () => new Date().toISOString();

export function createDefaultNotificationsEngineDocument(
  label = "ROVEXO Notifications Engine",
): NotificationsEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    notificationTypes: NOTIFICATIONS_ENGINE_TYPES.map((t) => ({ ...t, enabled: true })),
    channels: NOTIFICATIONS_ENGINE_CHANNELS.map((c) => ({
      ...c,
      enabled: ["in-app", "push", "email", "browser"].includes(c.id),
    })),
    priorities: NOTIFICATIONS_ENGINE_PRIORITIES.map((p) => ({ ...p, enabled: true })),
    events: NOTIFICATIONS_ENGINE_EVENTS.map((e) => ({ ...e, enabled: true })),
    filters: NOTIFICATIONS_ENGINE_FILTERS.map((f) => ({ ...f, enabled: true })),
    templates: NOTIFICATIONS_ENGINE_TEMPLATES.map((t) => ({ ...t, enabled: true })),
    badgeSurfaces: NOTIFICATIONS_ENGINE_BADGE_SURFACES.map((s) => ({ ...s, enabled: true })),
    userPreferences: {
      enablePush: true,
      enableEmail: true,
      enableBrowser: true,
      enableMarketing: false,
      enableSystemAlerts: true,
      enableOrderAlerts: true,
      enablePaymentAlerts: true,
      enableShippingAlerts: true,
      enableProtectionAlerts: true,
      enableMessageAlerts: true,
      enableSecurityAlerts: true,
      doNotDisturb: false,
      quietHours: true,
    },
    adminAlerts: {
      platformErrors: true,
      paymentErrors: true,
      shippingFailures: true,
      walletErrors: true,
      securityAlerts: true,
      serverHealth: true,
      databaseHealth: true,
      apiHealth: true,
      failedJobs: true,
      fraudAlerts: true,
      pendingDisputes: true,
    },
    aiAssistant: {
      globalEnabled: false,
      prioritization: true,
      duplicateDetection: true,
      smartRouting: true,
      deliveryOptimization: true,
      summaries: true,
      suggestedNotifications: true,
      execution: "local",
    },
    integrations: {
      messagesEngine: true,
      ordersEngine: true,
      shippingEngine: true,
      walletEngine: true,
      paymentsEngine: true,
      protectionEngine: true,
      listings: true,
      authentication: true,
      reviews: true,
      supportCenter: true,
      analytics: true,
    },
    futureReady: [
      "SMS",
      "WhatsApp",
      "Telegram",
      "Slack",
      "Microsoft Teams",
      "Apple Live Activities",
      "Android Live Notifications",
      "Wearables",
      "Smart Watches",
      "AI Notification Assistant",
      "Geo Notifications",
      "Location-Based Alerts",
      "Marketplace Campaigns",
    ],
    auditLog: [],
  };
}

export function createDefaultNotificationsEngineHistory(): NotificationsEngineHistoryEntry[] {
  return [];
}
