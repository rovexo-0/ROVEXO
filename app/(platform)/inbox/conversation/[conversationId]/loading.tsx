import { AccountCanonicalShell } from "@/features/account-canonical";

/**
 * Phase A1 — Conversation-only skeleton.
 * Must NOT inherit Inbox list loading (Orders → Conversation stays one hop).
 */
export default function ConversationLoading() {
  return (
    <AccountCanonicalShell
      title="Conversation"
      hideBack
      showBottomNav={false}
      contentClassName="!p-0"
    >
      <div
        className="conv-hub"
        data-conversation-freeze="FINAL-LOCK"
        role="status"
        aria-busy="true"
        aria-label="Loading conversation"
        data-skeleton="conversation"
      >
        <div className="conv-hub__header">
          <span className="conv-hub__skel conv-hub__skel--icon" />
          <span className="conv-hub__skel conv-hub__skel--title" />
          <span className="conv-hub__skel conv-hub__skel--icon" />
        </div>
        <div className="conv-hub__body">
          <div className="conv-hub__skel conv-hub__skel--card" />
          <div className="conv-hub__skel conv-hub__skel--card" />
          <div className="conv-hub__skel conv-hub__skel--thread" />
        </div>
      </div>
    </AccountCanonicalShell>
  );
}
