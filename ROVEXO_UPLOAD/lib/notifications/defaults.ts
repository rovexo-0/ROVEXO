import type { NotificationSettings } from "@/lib/notifications/types";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  browserPush: true,
  messages: true,
  orders: true,
  offers: true,
  reviews: true,
  promotions: true,
  marketing: false,
  system: true,
  emailMessages: true,
  emailOrders: true,
  emailPromotions: false,
  emailMarketing: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  sound: true,
  vibration: true,
};
