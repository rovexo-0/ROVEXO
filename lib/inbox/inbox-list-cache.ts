/**
 * Inbox list memory cache — client-only.
 * Survives tab switches / soft remounts so Notifications never flash empty.
 */

import type { Conversation } from "@/lib/messages/types";
import type { Notification } from "@/lib/notifications/types";

let conversationsCache: Conversation[] | null = null;
let notificationsCache: Notification[] | null = null;
let notificationsHydrated = false;
let conversationsHydrated = false;

export function getInboxConversationsCache(): Conversation[] | null {
  return conversationsCache;
}

export function setInboxConversationsCache(next: Conversation[]): void {
  conversationsCache = next;
  conversationsHydrated = true;
}

export function getInboxNotificationsCache(): Notification[] | null {
  return notificationsCache;
}

export function setInboxNotificationsCache(next: Notification[]): void {
  notificationsCache = next;
  notificationsHydrated = true;
}

export function hasInboxNotificationsCache(): boolean {
  return notificationsHydrated && notificationsCache !== null;
}

export function hasInboxConversationsCache(): boolean {
  return conversationsHydrated && conversationsCache !== null;
}

export function peekInboxNotificationsCache(): Notification[] {
  return notificationsCache ?? [];
}

export function peekInboxConversationsCache(): Conversation[] {
  return conversationsCache ?? [];
}

/**
 * After Hub send — bump Messages list cache so remount shows latest preview/order
 * without waiting for a live InboxPage listener (no new API / no polling).
 */
export function bumpInboxConversationPreview(input: {
  conversationId: string;
  lastMessage: string;
  lastMessageAt: string;
}): Conversation[] | null {
  const current = conversationsCache;
  if (!current?.length) return null;
  const existing = current.find((item) => item.id === input.conversationId);
  if (!existing) return null;
  const patched: Conversation = {
    ...existing,
    lastMessage: input.lastMessage,
    lastMessageAt: input.lastMessageAt,
  };
  const next = [patched, ...current.filter((item) => item.id !== input.conversationId)];
  conversationsCache = next;
  conversationsHydrated = true;
  return next;
}

/** Seed from RealtimeNotificationProvider before Inbox's own fetch resolves. */
export function seedInboxNotificationsCache(next: Notification[]): void {
  if (notificationsHydrated) return;
  if (next.length === 0) return;
  notificationsCache = next;
  notificationsHydrated = true;
}
