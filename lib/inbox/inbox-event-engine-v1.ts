/**
 * ROVEXO Inbox Event Engine v1.0 — Absolute Blood Law XLIII
 *
 * ONE SSOT for Messages · Notifications · Conversation · Unread · Badge ·
 * Last Message · Last Activity · Conversation Order · Read Status.
 *
 * Opening a Conversation Hub from any entry point runs ONE sync transaction.
 * FAIL CLOSED — no partial silent success.
 *
 * SERVER ONLY — never import from Client Components / hooks / browser utilities.
 */

import "server-only";

import { tryCreateAdminClient } from "@/lib/supabase/admin";

export const INBOX_EVENT_ENGINE_V1 = {
  version: "1.0",
  bloodLaw: "XLIII",
  name: "Inbox Event Engine",
  equation:
    "ONE_CONVERSATION = ONE_INBOX_EVENT = ONE_UNREAD = ONE_BADGE = ONE_READ_STATUS = FAIL_CLOSED",
  rpc: "sync_conversation_open_v1",
  clientBroadcastEvent: "rovexo:inbox-sync",
} as const;

export type InboxSyncOpenSource =
  | "notification"
  | "offer"
  | "counter_offer"
  | "accepted_offer"
  | "declined_offer"
  | "order"
  | "tracking"
  | "messages_tab"
  | "hub_mount"
  | "hub_focus"
  | "unknown";

export type InboxSyncOpenResult =
  | {
      ok: true;
      bloodLaw: "XLIII";
      conversationId: string;
      viewerId: string;
      source: InboxSyncOpenSource;
      viewerUnreadBefore: number;
      messagesMarkedRead: number;
      notificationsMarkedRead: number;
      syncedAt: string;
      badge: {
        conversationUnread: number;
        notificationUnread: number;
        inboxBadge: number;
      };
    }
  | {
      ok: false;
      code:
        | "INBOX_SYNC_INVALID_INPUT"
        | "INBOX_SYNC_CONVERSATION_NOT_FOUND"
        | "INBOX_SYNC_PERMISSION_DENIED"
        | "INBOX_SYNC_TRANSACTION_FAILED"
        | "INBOX_SYNC_ADMIN_UNAVAILABLE";
      message: string;
      httpStatus: number;
    };

function conversationHref(conversationId: string): string {
  return `/inbox/conversation/${conversationId}`;
}

function isConversationScopedHref(href: string, conversationId: string): boolean {
  const base = conversationHref(conversationId);
  return href === base || href.startsWith(`${base}?`) || href.startsWith(`${base}/`);
}

async function countUnreadNonMessageNotifications(
  admin: NonNullable<ReturnType<typeof tryCreateAdminClient>>,
  userId: string,
): Promise<number> {
  const { count } = await admin
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false)
    .neq("type", "message");
  return count ?? 0;
}

/**
 * Single fail-closed sync when a user opens a conversation.
 * Prefers Postgres RPC (true transaction). Falls back to admin sequential
 * path only when RPC is missing — still fail-closed (no silent partial).
 */
export async function syncConversationOpen(input: {
  conversationId: string;
  viewerId: string;
  source?: InboxSyncOpenSource;
}): Promise<InboxSyncOpenResult> {
  const source = input.source ?? "unknown";
  if (!input.conversationId?.trim() || !input.viewerId?.trim()) {
    return {
      ok: false,
      code: "INBOX_SYNC_INVALID_INPUT",
      message: "Inbox sync input invalid.",
      httpStatus: 400,
    };
  }

  const admin = tryCreateAdminClient() ?? null;
  if (!admin) {
    return {
      ok: false,
      code: "INBOX_SYNC_ADMIN_UNAVAILABLE",
      message: "Inbox sync unavailable.",
      httpStatus: 503,
    };
  }

  const { data: rpcData, error: rpcError } = await admin.rpc(
    "sync_conversation_open_v1" as never,
    {
      p_conversation_id: input.conversationId,
      p_viewer_id: input.viewerId,
    } as never,
  );

  if (!rpcError && rpcData && typeof rpcData === "object" && !Array.isArray(rpcData)) {
    const row = rpcData as Record<string, unknown>;
    if (row.ok === true) {
      const notificationUnread = await countUnreadNonMessageNotifications(admin, input.viewerId);
      return {
        ok: true,
        bloodLaw: "XLIII",
        conversationId: input.conversationId,
        viewerId: input.viewerId,
        source,
        viewerUnreadBefore: Number(row.viewerUnreadBefore ?? 0),
        messagesMarkedRead: Number(row.messagesMarkedRead ?? 0),
        notificationsMarkedRead: Number(row.notificationsMarkedRead ?? 0),
        syncedAt: String(row.syncedAt ?? new Date().toISOString()),
        badge: {
          conversationUnread: 0,
          notificationUnread,
          inboxBadge: notificationUnread,
        },
      };
    }
  }

  // Fallback when RPC not yet migrated: sequential fail-closed (same ownership checks).
  if (rpcError && !/function|does not exist|schema cache/i.test(rpcError.message ?? "")) {
    return {
      ok: false,
      code: "INBOX_SYNC_TRANSACTION_FAILED",
      message: "Inbox sync transaction failed.",
      httpStatus: 500,
    };
  }

  return syncConversationOpenFallback({
    conversationId: input.conversationId,
    viewerId: input.viewerId,
    source,
    admin,
  });
}

async function syncConversationOpenFallback(input: {
  conversationId: string;
  viewerId: string;
  source: InboxSyncOpenSource;
  admin: NonNullable<ReturnType<typeof tryCreateAdminClient>>;
}): Promise<InboxSyncOpenResult> {
  const { data: conversation, error: loadError } = await input.admin
    .from("conversations")
    .select("id, buyer_id, seller_id, buyer_unread_count, seller_unread_count")
    .eq("id", input.conversationId)
    .maybeSingle();

  if (loadError) {
    return {
      ok: false,
      code: "INBOX_SYNC_TRANSACTION_FAILED",
      message: "Inbox sync transaction failed.",
      httpStatus: 500,
    };
  }
  if (!conversation) {
    return {
      ok: false,
      code: "INBOX_SYNC_CONVERSATION_NOT_FOUND",
      message: "Conversation not found.",
      httpStatus: 404,
    };
  }

  const isBuyer = conversation.buyer_id === input.viewerId;
  const isSeller = conversation.seller_id === input.viewerId;
  if (!isBuyer && !isSeller) {
    return {
      ok: false,
      code: "INBOX_SYNC_PERMISSION_DENIED",
      message: "Permission denied.",
      httpStatus: 403,
    };
  }

  const unreadBefore = isBuyer
    ? Number(conversation.buyer_unread_count ?? 0)
    : Number(conversation.seller_unread_count ?? 0);

  const unreadPatch = isBuyer
    ? { buyer_unread_count: 0 }
    : { seller_unread_count: 0 };

  const { error: unreadError } = await input.admin
    .from("conversations")
    .update(unreadPatch)
    .eq("id", input.conversationId);

  if (unreadError) {
    return {
      ok: false,
      code: "INBOX_SYNC_TRANSACTION_FAILED",
      message: "Inbox sync transaction failed.",
      httpStatus: 500,
    };
  }

  const { data: messageRows, error: messageError } = await input.admin
    .from("messages")
    .update({ status: "read" })
    .eq("conversation_id", input.conversationId)
    .neq("sender_id", input.viewerId)
    .neq("status", "read")
    .select("id");

  if (messageError) {
    await input.admin
      .from("conversations")
      .update(
        isBuyer
          ? { buyer_unread_count: unreadBefore }
          : { seller_unread_count: unreadBefore },
      )
      .eq("id", input.conversationId);
    return {
      ok: false,
      code: "INBOX_SYNC_TRANSACTION_FAILED",
      message: "Inbox sync transaction failed.",
      httpStatus: 500,
    };
  }

  const { data: unreadNotifications, error: listNotifError } = await input.admin
    .from("notifications")
    .select("id, href, group_key")
    .eq("user_id", input.viewerId)
    .eq("read", false);

  if (listNotifError) {
    await input.admin
      .from("conversations")
      .update(
        isBuyer
          ? { buyer_unread_count: unreadBefore }
          : { seller_unread_count: unreadBefore },
      )
      .eq("id", input.conversationId);
    return {
      ok: false,
      code: "INBOX_SYNC_TRANSACTION_FAILED",
      message: "Inbox sync transaction failed.",
      httpStatus: 500,
    };
  }

  const scopedIds = (unreadNotifications ?? [])
    .filter((row) => {
      const href = row.href ?? "";
      const groupKey = row.group_key ?? "";
      return (
        isConversationScopedHref(href, input.conversationId) ||
        groupKey.includes(input.conversationId)
      );
    })
    .map((row) => row.id);

  let notificationsMarked = 0;
  if (scopedIds.length) {
    const { data: marked, error: notifError } = await input.admin
      .from("notifications")
      .update({ read: true })
      .eq("user_id", input.viewerId)
      .in("id", scopedIds)
      .select("id");

    if (notifError) {
      await input.admin
        .from("conversations")
        .update(
          isBuyer
            ? { buyer_unread_count: unreadBefore }
            : { seller_unread_count: unreadBefore },
        )
        .eq("id", input.conversationId);
      return {
        ok: false,
        code: "INBOX_SYNC_TRANSACTION_FAILED",
        message: "Inbox sync transaction failed.",
        httpStatus: 500,
      };
    }
    notificationsMarked = marked?.length ?? 0;
  }

  await input.admin.from("user_presence").upsert({
    user_id: input.viewerId,
    online: true,
    last_seen_at: new Date().toISOString(),
    typing_conversation_id: null,
  });

  const notificationUnread = await countUnreadNonMessageNotifications(input.admin, input.viewerId);

  return {
    ok: true,
    bloodLaw: "XLIII",
    conversationId: input.conversationId,
    viewerId: input.viewerId,
    source: input.source,
    viewerUnreadBefore: unreadBefore,
    messagesMarkedRead: messageRows?.length ?? 0,
    notificationsMarkedRead: notificationsMarked,
    syncedAt: new Date().toISOString(),
    badge: {
      conversationUnread: 0,
      notificationUnread,
      inboxBadge: notificationUnread,
    },
  };
}

/** @deprecated Prefer syncConversationOpen — kept as thin adapter for legacy callers. */
export async function markConversationReadViaInboxEventEngine(
  conversationId: string,
  viewerId: string,
): Promise<void> {
  const result = await syncConversationOpen({
    conversationId,
    viewerId,
    source: "hub_mount",
  });
  if (!result.ok) {
    throw new Error(result.message);
  }
}

export function conversationHrefForSync(conversationId: string): string {
  return conversationHref(conversationId);
}

export function isInboxConversationHref(href: string, conversationId: string): boolean {
  return isConversationScopedHref(href, conversationId);
}
