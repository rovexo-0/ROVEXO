/**
 * ROVEXO Messages Final Cleanup v1.0 — COD SÂNGE
 *
 * STATUS: OWNER AUTHORIZED · MESSAGES HUB ARCHITECTURE ONLY
 *
 * Messages is the Communication Hub — never Wallet / Invoice / Order Summary.
 * Realtime is the single live transport. One product = one order = one label.
 * Dead sheets / legacy UI / financial surfaces are forbidden inside Messages.
 */
export const MESSAGES_FINAL_CLEANUP_V1 = {
  version: "v1.0",
  codename: "COD_SANGE_MESSAGES_FINAL_CLEANUP",
  presentationOnly: true,
  enginesUntouched: [
    "Escrow",
    "Wallet",
    "Payment",
    "Shipping",
    "Checkout",
    "Offers",
    "Dispute",
    "Review",
  ] as const,
  realtimeIsSingleLiveTransport: true,
  oneShippingLabelOnly: true,
  oneDynamicTransactionCardOnly: true,
  zeroFinancialBalancesInMessages: true,
  deadComponentsRemoved: [
    "ConversationTrackingSheet",
    "ReviewTeaserSheet",
  ] as const,
  ssot: {
    hub: "features/inbox/components/ConversationHub.tsx",
    inbox: "features/inbox/components/InboxPage.tsx",
    view: "lib/inbox/conversation-view.ts",
    card: "lib/inbox/transaction-status-card-v1.ts",
    conversationRealtime: "lib/inbox/conversation-realtime.ts",
    inboxRealtime: "lib/inbox/realtime.ts",
  },
} as const;

export function assertMessagesFinalCleanupContract(): typeof MESSAGES_FINAL_CLEANUP_V1 {
  return MESSAGES_FINAL_CLEANUP_V1;
}
