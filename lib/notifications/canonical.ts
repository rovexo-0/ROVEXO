/**
 * ROVEXO Notifications module — canonical markers v1.0
 */

export const NOTIFICATIONS_MODULE_VERSION = "1.0" as const;
export const NOTIFICATIONS_MODULE_STATUS = "CANONICAL_v1.0" as const;

export const NOTIFICATIONS_ROUTES = {
  /** Inbox Hub is the live list surface (frozen). Legacy /notifications redirects there. */
  hub: "/inbox?tab=notifications",
  legacyList: "/notifications",
  detail: "/notifications/[id]",
  settings: "/notifications/settings",
  preferences: "/notifications/preferences",
} as const;

export const NOTIFICATIONS_CANONICAL_SURFACES = [
  "lib/notifications/catalog.ts",
  "lib/notifications/controls.ts",
  "lib/notifications/events.ts",
  "lib/notifications/routing.ts",
  "features/inbox/components/InboxPage.tsx",
  "features/notifications/components/NotificationSettingsPage.tsx",
  "features/notifications/components/RealtimeNotificationProvider.tsx",
] as const;
