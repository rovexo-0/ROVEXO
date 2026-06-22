export type NotificationFilter =
  | "all"
  | "messages"
  | "orders"
  | "offers"
  | "payments"
  | "reviews"
  | "followers"
  | "promotions"
  | "moderation"
  | "system";

export type NotificationType =
  | "message"
  | "order"
  | "offer"
  | "review"
  | "payment"
  | "follower"
  | "moderation"
  | "promotion_expired"
  | "saved_item_sold"
  | "price_reduced"
  | "saved_search_match"
  | "system";

export type NotificationIcon =
  | "message"
  | "order"
  | "offer"
  | "review"
  | "payment"
  | "follower"
  | "moderation"
  | "promotion"
  | "product"
  | "system";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  subtitle: string;
  createdAt: string;
  read: boolean;
  href: string;
  avatarUrl?: string | null;
  avatarName?: string;
  icon: NotificationIcon;
  detail?: string;
};

export type NotificationSettings = {
  pushEnabled: boolean;
  messages: boolean;
  orders: boolean;
  offers: boolean;
  reviews: boolean;
  system: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  sound: boolean;
  vibration: boolean;
};
