/**
 * ROVEXO BUYER CONVERSATION HUB — MASTER STACK v1.0
 *
 * STATUS: ABSOLUTE MASTER APPROVED · 2026-07-23
 * Owner-approved image + Master Stack = CANONICAL vertical order.
 *
 * Sticky CTA MUST show TOTAL BUYER PAYS (never item-only £).
 * Mock item-only CTA = FAIL.
 *
 * Parent: Master Buyer Conversation Hub Freeze · Blood V · Blood VII
 * Child: Buyer Conversation Hub Master UI Freeze (1:1)
 */

import { MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1 } from "@/lib/inbox/master-buyer-conversation-hub-freeze-v1";

export const MASTER_STACK_BUYER_HUB_V1 = {
  version: "v1.0",
  name: "MASTER_STACK_BUYER_CONVERSATION_HUB",
  status: "ABSOLUTE_MASTER_APPROVED",
  productPassLabel: "BUYER_CONVERSATION_HUB_V1_PASS",
  approvedByOwner: true,
  absoluteMasterApproved: true,
  locked: true,
  frozen: true,
  permanent: true,
  approvedAt: "2026-07-23",
  onlySourceOfTruth: "OWNER_APPROVED_MASTER_IMAGE",
  doNotRedesign: true,
  doNotImprovise: true,
  doNotCreateNewComponents: true,
  surface: "/inbox/conversation/[conversationId]",
  component: "features/inbox/components/ConversationHub.tsx",

  /** Locked top → bottom. Missing any layer = FAIL. */
  stack: [
    "HEADER",
    "PRODUCT_CARD",
    "ORDER_STATUS_CARD",
    "SELLER_INFORMATION_AND_ORDER_SUMMARY",
    "OFFER_HISTORY",
    "CHAT_HISTORY",
    "MESSAGE_INPUT",
    "STICKY_BUY_NOW_BUTTON",
    "SAFE_AREA",
  ] as const,

  header: {
    heightPx: 44,
    required: ["BACK", "USERNAME", "LAST_ACTIVE", "INFO_BUTTON"] as const,
  } as const,

  productCard: {
    imagePx: 72,
    titleMaxLines: 2,
    priceFontPx: 16,
    totalBuyerPaysFontPx: 14,
    activeBadge: "PURPLE",
    wholeCardClickable: true,
    buyerShows: ["IMAGE", "TITLE", "ITEM_PRICE", "TOTAL_BUYER_PAYS_INCL_SHIELD", "ACTIVE_BADGE", "CHEVRON"] as const,
  } as const,

  orderStatusCard: {
    clickable: true,
    required: ["BOX_ICON", "ORDER_STATUS_LABEL", "STATUS_VALUE", "CHEVRON"] as const,
  } as const,

  sellerInformationBuyerSees: [
    "AVATAR",
    "LOCATION",
    "ACTIVE_STATUS",
    "RATING",
    "REVIEWS",
  ] as const,

  /** Seller may see buyer information only after payment when permitted. */
  buyerInformationSellerSeesAfterPaymentOnly: true,

  orderSummaryBuyer: ["SUBTOTAL", "PLATFORM_FEE", "YOU_WILL_PAY"] as const,
  orderSummarySeller: ["SELLING_PRICE", "YOU_WILL_RECEIVE"] as const,
  orderSummarySellerForbidden: [
    "PLATFORM_FEE",
    "TOTAL_BUYER_PAYS",
    "BUYER_BREAKDOWN",
  ] as const,

  offerHistory: {
    supportsUnlimitedOffers: true,
    exampleCapacities: [10, 20, 50] as const,
  } as const,

  chatSupports: [
    "TEXT",
    "IMAGES",
    "TRACKING",
    "SYSTEM_MESSAGES",
    "PAYMENT_MESSAGES",
    "ISSUE_MESSAGES",
    "AUTOMATION_MESSAGES",
  ] as const,

  messageInput: {
    placeholder: "Write a message...",
    required: ["CAMERA", "FIELD", "SEND"] as const,
    supports: ["IMAGES", "VIDEOS", "DOCUMENTS", "TRACKING", "EMOJIS"] as const,
  } as const,

  stickyCta: {
    heightPx: 56,
    radiusPx: 16,
    fullWidth: true,
    sticky: true,
    purple: true,
    alwaysTotalBuyerPays: true,
    forbiddenItemOnlyPrice: true,
    canonicalExample: "BUY NOW • £TOTAL",
    buyerStates: [
      "BUY_NOW",
      "PAY_NOW",
      "TRACK_PARCEL",
      "EVERYTHING_OK",
      "REPORT_ISSUE",
      "REVIEW",
      "COMPLETED",
    ] as const,
    sellerStates: [
      "PRINT_LABEL",
      "PREPARE_ORDER",
      "TRACK_PARCEL",
      "PAYMENT_PENDING",
      "PAYMENT_RELEASED",
      "WITHDRAW",
      "COMPLETED",
    ] as const,
    autoSequence: [
      "MAKE_OFFER",
      "BUY_NOW",
      "PAY_NOW",
      "PREPARE_ORDER",
      "PRINT_LABEL",
      "TRACK_PARCEL",
      "DELIVERED",
      "EVERYTHING_OK_OR_REPORT_ISSUE",
      "PAYMENT_RELEASE",
      "REVIEW",
      "COMPLETED",
    ] as const,
    neverLeaveHub: true,
  } as const,

  productPassRequiresExact: [
    "HEADER",
    "PRODUCT_CARD",
    "ORDER_STATUS",
    "SELLER_INFORMATION",
    "ORDER_SUMMARY",
    "OFFER_HISTORY",
    "CHAT",
    "MESSAGE_INPUT",
    "STICKY_CTA",
    "TOTAL_BUYER_PAYS",
    "PURPLE_THEME",
    "AUTOMATIC_CTA_STATES",
    "RESPONSIVE",
    "IPHONE_17_PRO_MAX",
    "ZERO_WHITE_SCREEN",
    "ZERO_REGRESSION",
    "100%_AUTOMATION",
  ] as const,

  ssot: {
    code: "lib/inbox/master-stack-buyer-hub-v1.ts",
    rule: ".cursor/rules/master-stack-buyer-hub-v1.mdc",
    doc: "docs/modules/inbox/MASTER_STACK_BUYER_HUB_V1.md",
  } as const,

  parent: MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.ssot.code,
} as const;

export type MasterStackBuyerHubV1 = typeof MASTER_STACK_BUYER_HUB_V1;

/** "Active 2h ago" / Online — Master Stack header + seller card. */
export function formatMasterStackActiveLabel(input: {
  online: boolean;
  lastSeen?: string | null;
  nowMs?: number;
}): string {
  if (input.online) return "Online";
  if (!input.lastSeen) return "Offline";
  const now = input.nowMs ?? Date.now();
  const then = new Date(input.lastSeen).getTime();
  if (!Number.isFinite(then)) return "Offline";
  const diffMs = Math.max(0, now - then);
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Active just now";
  if (mins < 60) return `Active ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Active ${days}d ago`;
  return `Active ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(input.lastSeen))}`;
}

export function formatMasterStackLocation(city: string | null | undefined): string | null {
  const trimmed = city?.trim();
  if (!trimmed) return null;
  if (/,\s*uk$/i.test(trimmed)) return trimmed;
  return `${trimmed}, UK`;
}

export function formatMasterStackRatingLine(
  rating: number | null | undefined,
  reviewCount: number | null | undefined,
): string {
  const count = reviewCount ?? 0;
  if (count <= 0) return "New member";
  const score = (rating ?? 0).toFixed(1);
  return `${score} (${count} review${count === 1 ? "" : "s"})`;
}
