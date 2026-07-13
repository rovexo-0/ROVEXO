"use client";

import Link from "next/link";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";
import "@/styles/rovexo/inbox-hub-v1.css";

type ConversationPlaceholderProps = {
  conversationId: string;
};

/** Sprint 2 target — Conversation Hub placeholder only. */
export function ConversationPlaceholder({ conversationId }: ConversationPlaceholderProps) {
  return (
    <AccountCanonicalShell
      title="Conversation"
      showHeaderTitle
      backHref={INBOX_ROUTES.hub}
      bottomNavTab="saved"
    >
      <div className="inbox-hub" data-inbox-conversation="placeholder-sprint-2">
        <div className="inbox-hub__empty">
          <p className="inbox-hub__empty-title">Conversation Hub coming soon</p>
          <p style={{ marginTop: 12, color: "#8b8b93", fontSize: 14, maxWidth: 280 }}>
            This thread ({conversationId}) opens here in Sprint 2.
          </p>
          <Link href={INBOX_ROUTES.hub} className="inbox-hub__empty-cta">
            Back to Inbox
          </Link>
        </div>
      </div>
    </AccountCanonicalShell>
  );
}
