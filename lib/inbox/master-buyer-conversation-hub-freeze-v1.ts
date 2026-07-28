/**
 * ROVEXO v1.0 — MASTER BUYER CONVERSATION HUB FREEZE v1.0
 *
 * STATUS: PERMANENT FREEZE APPROVED · ABSOLUTE LAW · 2026-07-23
 * Owner-approved image = CANONICAL MASTER UI.
 * No alternate Buyer Conversation Hub UI without Owner approval.
 *
 * Code PASS ≠ Product PASS.
 * Product PASS = Code + Tests + Preview + Visual PASS + Owner Approval + Certification.
 *
 * Surface: /inbox/conversation/[conversationId]
 * Component: features/inbox/components/ConversationHub.tsx
 */

export const MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1 = {
  version: "v1.0",
  name: "MASTER_BUYER_CONVERSATION_HUB_FREEZE",
  status: "PERMANENT_FREEZE_APPROVED",
  approvedByOwner: true,
  absoluteMasterApproved: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  permanent: true,
  neverRemove: true,
  approvedAt: "2026-07-23",
  onlySourceOfTruth: "OWNER_APPROVED_MASTER_IMAGE",
  doNotRedesign: true,
  doNotImprovise: true,
  doNotCreateNewComponents: true,
  surface: "/inbox/conversation/[conversationId]",
  component: "features/inbox/components/ConversationHub.tsx",

  absoluteLaws: {
    ownerApprovedImageIsCanonicalMasterUi: true,
    noAlternateBuyerUiWithoutOwnerApproval: true,
    codePassIsNotProductPass: true,
    whiteScreenProductFail: true,
    emptyScreenProductFail: true,
    missingImageProductFail: true,
    missingPayNowButtonProductFail: true,
    missingStickyBottomActionProductFail: true,
    zeroRegressionPermanentMandatory: true,
  } as const,

  productPassRequires: [
    "CODE",
    "TESTS",
    "PREVIEW",
    "VISUAL_PASS",
    "OWNER_APPROVAL",
    "CERTIFICATION",
  ] as const,

  /** Locked vertical order — Master Stack v1.0 (nothing may be removed). */
  uiOrder: [
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

  buyerMustSee: [
    "PRODUCT_IMAGE",
    "TITLE",
    "ITEM_PRICE",
    "TOTAL_BUYER_PAYS_INCL",
    "ORDER_STATUS",
    "SELLER_INFORMATION",
    "ORDER_SUMMARY",
    "OFFER_HISTORY",
    "MESSAGES",
    "WRITE_MESSAGE",
    "BUY_NOW_FINAL_TOTAL",
    "PLATFORM_FEE",
    "SHIPPING",
    "TRACKING",
    "EVERYTHING_OK",
    "ISSUE_CENTER",
    "REVIEWS",
    "REFUND_STATUS",
    "PAYMENT_STATUS",
  ] as const,

  sellerMustNeverSee: [
    "PLATFORM_FEE",
    "BUYER_TOTAL",
    "BUYER_BREAKDOWN",
    "SHIPPING_FEE_PAID_BY_BUYER",
    "TOTAL_BUYER_PAYS",
  ] as const,

  sellerMaySee: [
    "ITEM_PRICE",
    "PAID",
    "PRINT_LABEL",
    "TRACK_PARCEL",
    "DELIVERED",
    "PAYMENT_PENDING",
    "PAYMENT_RELEASED",
    "WITHDRAW",
  ] as const,

  /** Sticky CTA — always final buyer total, never item-only price. */
  stickyCta: {
    labelPrefix: "BUY NOW",
    separator: "•",
    alwaysFinalBuyerTotal: true,
    forbiddenItemOnlyPrice: true,
  } as const,

  paymentFlow: [
    "MAKE_OFFER",
    "DECLINED",
    "ACCEPTED",
    "BUY_NOW",
    "PAYMENT_SUCCESS",
    "ESCROW",
    "PRINT_LABEL",
    "TRACKING",
    "DELIVERED",
    "EVERYTHING_OK",
    "PAYMENT_RELEASE",
    "SELLER_WALLET",
    "WITHDRAW",
    "REVIEW",
    "COMPLETED",
  ] as const,

  issueCenterFlow: [
    "DELIVERED",
    "I_HAVE_AN_ISSUE",
    "PAYMENT_HOLD",
    "AUTOMATIC_REVIEW",
    "BUYER_EVIDENCE",
    "SELLER_RESPONSE",
    "AI_ENGINE",
    "AUTOMATIC_DECISION",
    "REFUND_OR_PAYMENT_RELEASE",
  ] as const,

  automationTarget: "100%",
  automatedDomains: [
    "Payments",
    "Escrow",
    "Tracking",
    "Notifications",
    "Reviews",
    "Payment Release",
    "Refunds",
    "HMRC reporting",
    "Wallet",
    "Sendcloud",
    "Stripe",
    "Fraud detection",
    "Risk engine",
    "Verification engine",
    "Issue center",
    "Seller statistics",
    "Buyer statistics",
  ] as const,

  superAdmin: {
    notRequiredForPlatformOperation: true,
    optionalOnly: true,
    controls: [
      "ON",
      "OFF",
      "EMERGENCY_STOP",
      "GLOBAL_ON",
      "GLOBAL_OFF",
      "MANUAL_HOLD",
      "MANUAL_RELEASE",
      "MANUAL_REFUND",
      "MANUAL_PAYMENT_RELEASE",
    ] as const,
  } as const,

  priority0BeforeCommit: [
    "NO_WHITE_SCREEN",
    "NO_EMPTY_PAGE",
    "NO_BUILD_ERROR",
    "NO_CSS_ERROR",
    "NO_TYPESCRIPT_ERROR",
    "NO_RESPONSIVE_FAIL",
    "NO_IMAGE_FAIL",
    "NO_BUTTON_FAIL",
    "NO_PREVIEW_FAIL",
    "OWNER_APPROVAL",
    "FREEZE",
    "TEST",
    "CERTIFICATION",
    "COMMIT",
    "PUSH",
    "DEPLOY",
  ] as const,

  permanentLaw:
    "IF OWNER CANNOT SEE + CLICK + SCROLL + PAY + BUY + SELL + TRACK + TEST = THE PRODUCT DOES NOT EXIST.",

  ssot: {
    code: "lib/inbox/master-buyer-conversation-hub-freeze-v1.ts",
    rule: ".cursor/rules/master-buyer-conversation-hub-freeze-v1.mdc",
    doc: "docs/modules/inbox/MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.md",
  } as const,

  childLaws: {
    masterUiFreeze: "lib/inbox/buyer-conversation-hub-master-ui-freeze-v1.ts",
    masterStack: "lib/inbox/master-stack-buyer-hub-v1.ts",
    supremeBloodCodeV: "lib/supreme-blood-code-v-v1.ts",
    constitutionOfLongevity: "lib/supreme-blood-code-vii-v1.ts",
    conversationHubPurification: "lib/supreme-blood-code-viii-v1.ts",
  } as const,
} as const;

export type MasterBuyerConversationHubFreezeV1 =
  typeof MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1;

/** Canonical sticky CTA — BUY NOW • £final_total (never item-only). */
export function formatBuyNowLabel(totalGbp: number): string {
  const amount = `£${totalGbp.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const { labelPrefix, separator } = MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.stickyCta;
  return `${labelPrefix} ${separator} ${amount}`;
}

/** @deprecated Prefer formatBuyNowLabel — Master Freeze v1.0 canonical CTA. */
export function formatPayNowLabel(totalGbp: number): string {
  return formatBuyNowLabel(totalGbp);
}
