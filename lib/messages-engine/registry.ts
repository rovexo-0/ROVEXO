import type { MessagesEngineFilterId, MessagesEngineModule } from "@/lib/messages-engine/types";

export const MESSAGES_ENGINE_MODULES: MessagesEngineModule[] = [
  { id: "dashboard", label: "Conversation Center", icon: "💬", description: "All buyer and seller conversations", href: "/messages" },
  { id: "search", label: "Search Engine", icon: "🔍", description: "Search conversations, messages, and attachments", href: "/messages?tab=search" },
  { id: "attachments", label: "Attachment Center", icon: "📎", description: "Images, documents, and shipping labels", href: "/messages?tab=attachments" },
  { id: "orders", label: "Orders Integration", icon: "📦", description: "Order chat, timeline, and refund updates", href: "/orders" },
  { id: "listings", label: "Listings Integration", icon: "🏷️", description: "Listing chat, offers, and product cards", href: "/search" },
  { id: "shipping", label: "Shipping Integration", icon: "🚚", description: "Tracking and delivery notifications", href: "/shipping" },
  { id: "protection", label: "Purchase Protection Integration", icon: "🛡️", description: "Case chat and evidence sharing", href: "/protection" },
  { id: "moderation", label: "Moderation", icon: "⚖️", description: "Reports, spam detection, and admin review", href: "/messages?tab=moderation" },
  { id: "analytics", label: "Analytics", icon: "📈", description: "Response time and conversation metrics", href: "/messages?tab=analytics" },
];

export const MESSAGES_ENGINE_CONVERSATION_TYPES = [
  { id: "buyer-seller", label: "Buyer ↔ Seller" },
  { id: "buyer-business", label: "Buyer ↔ Business" },
  { id: "seller-buyer", label: "Seller ↔ Buyer" },
  { id: "seller-administrator", label: "Seller ↔ Administrator" },
  { id: "business-customer", label: "Business ↔ Customer" },
  { id: "administrator-user", label: "Administrator ↔ User" },
  { id: "support", label: "Support Conversation" },
  { id: "order", label: "Order Conversation" },
  { id: "dispute", label: "Dispute Conversation" },
  { id: "system", label: "System Conversation" },
] as const;

export const MESSAGES_ENGINE_MESSAGE_TYPES = [
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "pdf", label: "PDF" },
  { id: "documents", label: "Documents" },
  { id: "location", label: "Location" },
  { id: "product-card", label: "Product Card" },
  { id: "listing-share", label: "Listing Share" },
  { id: "order-share", label: "Order Share" },
  { id: "tracking-update", label: "Tracking Update" },
  { id: "system", label: "System Message" },
  { id: "voice-message", label: "Voice Message" },
  { id: "video-call", label: "Video Call" },
] as const;

export const MESSAGES_ENGINE_CONVERSATION_STATUSES = [
  { id: "new", label: "New" },
  { id: "active", label: "Active" },
  { id: "archived", label: "Archived" },
  { id: "muted", label: "Muted" },
  { id: "pinned", label: "Pinned" },
  { id: "blocked", label: "Blocked" },
  { id: "reported", label: "Reported" },
  { id: "deleted", label: "Deleted" },
] as const;

export const MESSAGES_ENGINE_MESSAGE_STATUSES = [
  { id: "sending", label: "Sending" },
  { id: "sent", label: "Sent" },
  { id: "delivered", label: "Delivered" },
  { id: "read", label: "Read" },
  { id: "edited", label: "Edited" },
  { id: "deleted", label: "Deleted" },
  { id: "failed", label: "Failed" },
] as const;

export const MESSAGES_ENGINE_FILTERS: { id: MessagesEngineFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "active", label: "Active" },
  { id: "archived", label: "Archived" },
  { id: "pinned", label: "Pinned" },
  { id: "muted", label: "Muted" },
  { id: "blocked", label: "Blocked" },
  { id: "reported", label: "Reported" },
];

export const MESSAGES_ENGINE_SEARCH_SCOPES = [
  { id: "conversations", label: "Conversations" },
  { id: "users", label: "Users" },
  { id: "listings", label: "Listings" },
  { id: "orders", label: "Orders" },
  { id: "attachments", label: "Attachments" },
  { id: "messages", label: "Messages" },
] as const;

export const MESSAGES_ENGINE_ATTACHMENT_TYPES = [
  { id: "images", label: "Images" },
  { id: "videos", label: "Videos" },
  { id: "pdf", label: "PDF" },
  { id: "invoices", label: "Invoices" },
  { id: "receipts", label: "Receipts" },
  { id: "shipping-labels", label: "Shipping Labels" },
  { id: "screenshots", label: "Screenshots" },
  { id: "documents", label: "Documents" },
] as const;

export function registerMessagesEngineModule(module: MessagesEngineModule): MessagesEngineModule[] {
  const index = MESSAGES_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...MESSAGES_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...MESSAGES_ENGINE_MODULES, module];
}
