import type { NotificationSettings } from "@/lib/notifications/types";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  messages: true,
  orders: true,
  offers: true,
  reviews: true,
  system: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  sound: true,
  vibration: true,
};
