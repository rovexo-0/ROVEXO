/**
 * ROVEXO Messages Master Rewrite v1.0 — COD SÂNGE
 *
 * STATUS: OWNER AUTHORIZED · UI ARCHITECTURE ONLY
 *
 * Messages is NOT: Wallet · Order Summary · Invoice · Financial Dashboard.
 * Messages IS: Conversation · Transaction Status · Shipping Progress ·
 *              ONE Dynamic Transaction Card · Review · Dispute.
 *
 * Role separation is mandatory. Wallet is the only financial location.
 * Reuse existing escrow / wallet / dispute / review engines — rendering only.
 */
export const MESSAGES_MASTER_REWRITE_V1 = {
  version: "v1.0",
  codename: "COD_SANGE_MESSAGES",
  presentationOnly: true,
  oneDynamicCardOnly: true,
  walletIsOnlyFinancialLocation: true,
  invoicesForbiddenForMarketplaceTransactions: true,
  orderSummaryForbiddenInMessages: true,
  buyerNeverSees: [
    "Withdraw",
    "Funds Released",
    "Wallet",
    "Pending Balance",
    "Available Balance",
    "Seller Wallet",
    "Seller Payout",
    "Order Summary",
    "Invoice",
    "Platform Financial Cards",
  ] as const,
  sellerNeverSees: [
    "Withdraw",
    "Wallet",
    "Balance",
    "Pending Balance",
    "Available Balance",
    "Wallet History",
    "Financial Cards",
    "Order Summary",
    "Invoice",
  ] as const,
  buyerDeliveredCard: {
    title: "Parcel Delivered",
    description: "Is everything OK?",
    primary: "Everything OK",
    secondary: "I Have an Issue",
  },
  sellerDeliveredCard: {
    title: "Waiting for buyer confirmation...",
  },
  sellerCompletedCard: {
    title: "Sale completed",
    description: "Thank you for selling on ROVEXO.",
  },
  ssot: {
    card: "lib/inbox/transaction-status-card-v1.ts",
    view: "lib/inbox/conversation-view.ts",
    hub: "features/inbox/components/ConversationHub.tsx",
  },
} as const;
