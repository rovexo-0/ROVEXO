import type { NotificationsEngineFilterId, NotificationsEngineModule } from "@/lib/notifications-engine/types";

export const NOTIFICATIONS_ENGINE_MODULES: NotificationsEngineModule[] = [
  { id: "center", label: "Notification Center", icon: "🔔", description: "In-app notification inbox and history", href: "/notifications" },
  { id: "preferences", label: "User Preferences", icon: "⚙️", description: "Push, email, browser, and quiet hours", href: "/notifications/settings" },
  { id: "badges", label: "Live Badges", icon: "🔴", description: "Dynamic badge counters across the platform", href: "/notifications?tab=badges" },
  { id: "messages", label: "Messages Integration", icon: "💬", description: "New message and chat alerts", href: "/messages" },
  { id: "orders", label: "Orders Integration", icon: "📦", description: "Order lifecycle notifications", href: "/orders" },
  { id: "payments", label: "Payments Integration", icon: "💳", description: "Payment and refund alerts", href: "/payments" },
  { id: "shipping", label: "Shipping Integration", icon: "🚚", description: "Tracking and delivery updates", href: "/shipping" },
  { id: "wallet", label: "Wallet Integration", icon: "👛", description: "Balance and withdrawal alerts", href: "/wallet" },
  { id: "protection", label: "Buyer Protection Integration", icon: "🛡️", description: "Case and resolution alerts", href: "/protection" },
  { id: "analytics", label: "Analytics", icon: "📈", description: "Delivery, open rate, and performance", href: "/notifications?tab=analytics" },
];

export const NOTIFICATIONS_ENGINE_TYPES = [
  { id: "system", label: "System Notification" },
  { id: "buyer", label: "Buyer Notification" },
  { id: "seller", label: "Seller Notification" },
  { id: "business", label: "Business Notification" },
  { id: "administrator", label: "Administrator Notification" },
  { id: "security", label: "Security Notification" },
  { id: "marketing", label: "Marketing Notification" },
  { id: "support", label: "Support Notification" },
  { id: "platform", label: "Platform Notification" },
] as const;

export const NOTIFICATIONS_ENGINE_CHANNELS = [
  { id: "in-app", label: "In-App Notification" },
  { id: "push", label: "Push Notification" },
  { id: "email", label: "Email Notification" },
  { id: "browser", label: "Browser Notification" },
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telegram", label: "Telegram" },
  { id: "teams", label: "Microsoft Teams" },
  { id: "slack", label: "Slack" },
] as const;

export const NOTIFICATIONS_ENGINE_PRIORITIES = [
  { id: "information", label: "Information" },
  { id: "success", label: "Success" },
  { id: "warning", label: "Warning" },
  { id: "important", label: "Important" },
  { id: "critical", label: "Critical" },
  { id: "emergency", label: "Emergency" },
] as const;

export const NOTIFICATIONS_ENGINE_EVENTS = [
  { id: "account-created", label: "Account Created" },
  { id: "verification-completed", label: "Verification Completed" },
  { id: "listing-published", label: "Listing Published" },
  { id: "listing-sold", label: "Listing Sold" },
  { id: "offer-received", label: "Offer Received" },
  { id: "offer-accepted", label: "Offer Accepted" },
  { id: "offer-declined", label: "Offer Declined" },
  { id: "new-message", label: "New Message" },
  { id: "order-created", label: "Order Created" },
  { id: "payment-authorized", label: "Payment Authorized" },
  { id: "payment-failed", label: "Payment Failed" },
  { id: "refund-issued", label: "Refund Issued" },
  { id: "protection-activated", label: "Buyer Protection Activated" },
  { id: "case-opened", label: "Case Opened" },
  { id: "shipping-label-created", label: "Shipping Label Created" },
  { id: "parcel-collected", label: "Parcel Collected" },
  { id: "tracking-updated", label: "Tracking Updated" },
  { id: "out-for-delivery", label: "Out For Delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "order-completed", label: "Order Completed" },
  { id: "wallet-updated", label: "Wallet Updated" },
  { id: "withdrawal-approved", label: "Withdrawal Approved" },
  { id: "withdrawal-completed", label: "Withdrawal Completed" },
  { id: "review-received", label: "Review Received" },
  { id: "system-maintenance", label: "System Maintenance" },
  { id: "security-alert", label: "Security Alert" },
  { id: "admin-announcement", label: "Administrator Announcement" },
] as const;

export const NOTIFICATIONS_ENGINE_FILTERS: { id: NotificationsEngineFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
  { id: "messages", label: "Messages" },
  { id: "orders", label: "Orders" },
  { id: "payments", label: "Payments" },
  { id: "shipping", label: "Shipping" },
  { id: "protection", label: "Protection" },
  { id: "security", label: "Security" },
  { id: "system", label: "System" },
];

export const NOTIFICATIONS_ENGINE_TEMPLATES = [
  { id: "order", label: "Order" },
  { id: "payment", label: "Payment" },
  { id: "shipping", label: "Shipping" },
  { id: "wallet", label: "Wallet" },
  { id: "protection", label: "Protection" },
  { id: "message", label: "Message" },
  { id: "review", label: "Review" },
  { id: "security", label: "Security" },
  { id: "marketing", label: "Marketing" },
  { id: "maintenance", label: "Maintenance" },
  { id: "system", label: "System" },
] as const;

export const NOTIFICATIONS_ENGINE_BADGE_SURFACES = [
  { id: "homepage", label: "Homepage", color: "blue" as const },
  { id: "messages", label: "Messages", color: "blue" as const },
  { id: "orders", label: "Orders", color: "green" as const },
  { id: "wallet", label: "Wallet", color: "purple" as const },
  { id: "notifications", label: "Notifications", color: "orange" as const },
  { id: "saved", label: "Saved Items", color: "blue" as const },
  { id: "protection", label: "Buyer Protection", color: "red" as const },
  { id: "support", label: "Support", color: "green" as const },
  { id: "account", label: "Account", color: "blue" as const },
  { id: "super-admin", label: "Super Admin", color: "critical-flash" as const },
] as const;

export function registerNotificationsEngineModule(module: NotificationsEngineModule): NotificationsEngineModule[] {
  const index = NOTIFICATIONS_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...NOTIFICATIONS_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...NOTIFICATIONS_ENGINE_MODULES, module];
}
