/**
 * ROVEXO BUYER CONVERSATION HUB v1.0 — MASTER UI FREEZE (1:1)
 *
 * STATUS: ABSOLUTE MASTER APPROVED · PERMANENT FREEZE · 2026-07-23
 * NEVER REMOVE
 *
 * THE IMAGE APPROVED BY OWNER IS THE ONLY SOURCE OF TRUTH.
 *
 * DO NOT REDESIGN.
 * DO NOT IMPROVISE.
 * DO NOT CREATE NEW COMPONENTS.
 * DO NOT CHANGE THE MASTER UI WITHOUT OWNER APPROVAL.
 *
 * Surface: features/inbox/components/ConversationHub.tsx only (SSOT).
 */

export const BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1 = {
  version: "v1.0",
  name: "BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE",
  status: "ABSOLUTE_MASTER_APPROVED",
  productPassLabel: "ROVEXO_BUYER_CONVERSATION_HUB_100_100_PRODUCT_PASS",
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
  changeRequiresOwnerApproval: true,

  equation: {
    oneOrder: true,
    oneConversationHub: true,
    onePage: true,
    oneScroll: true,
    oneExperience: true,
    oneTruth: true,
  } as const,

  surface: "/inbox/conversation/[conversationId]",
  component: "features/inbox/components/ConversationHub.tsx",

  header: {
    only: ["BACK", "USERNAME", "ACTIVE_STATUS", "INFO_BUTTON"] as const,
    forbidden: [
      "ROVEXO_LOGO",
      "SEARCH_BAR",
      "EXTRA_BUTTONS",
      "EXTRA_TEXT",
      "EXTRA_MENUS",
    ] as const,
  } as const,

  productCard: {
    mustContain: [
      "PRODUCT_IMAGE",
      "TITLE_MAX_2_LINES",
      "ITEM_PRICE",
      "TOTAL_BUYER_PAYS",
      "SHIELD_ICON",
      "ACTIVE_BADGE",
      "CHEVRON",
    ] as const,
    forbidden: [
      "LARGE_IMAGES",
      "EXTRA_INFORMATION",
      "LARGE_PADDINGS",
      "EMPTY_SPACES",
    ] as const,
    compactPremium: true,
  } as const,

  orderStatus: {
    mustContain: ["ICON", "ORDER_STATUS_LABEL", "STATUS_VALUE", "CHEVRON"] as const,
    clickable: true,
  } as const,

  sellerInformation: {
    left: ["AVATAR", "LOCATION", "ACTIVE_STATUS", "RATING"] as const,
    rightOrderSummary: ["SUBTOTAL", "PLATFORM_FEE", "YOU_WILL_PAY"] as const,
    buyerOnlySees: ["PLATFORM_FEE", "YOU_WILL_PAY"] as const,
    sellerNeverSees: [
      "PLATFORM_FEE",
      "TOTAL_BUYER_PAYS",
      "BUYER_BREAKDOWN",
    ] as const,
  } as const,

  offerHistory: {
    showDeclinedAndAccepted: true,
  } as const,

  chat: {
    mustNeverBeEmpty: true,
    mustFeelAlive: true,
    requiredKinds: [
      "BUYER_MESSAGES",
      "SELLER_MESSAGES",
      "SYSTEM_MESSAGES",
      "AUTOMATION_MESSAGES",
      "OFFER_MESSAGES",
      "PAYMENT_MESSAGES",
      "TRACKING_MESSAGES",
      "REFUND_MESSAGES",
      "REVIEW_MESSAGES",
      "TIMESTAMPS",
    ] as const,
  } as const,

  messageInput: {
    only: ["CAMERA_ICON", "WRITE_A_MESSAGE", "SEND_ICON"] as const,
    forbidden: ["AVATAR", "EXTRA_BUTTONS", "EXTRA_ICONS"] as const,
  } as const,

  stickyCta: {
    alwaysVisible: true,
    format: "BUY NOW • £TOTAL",
    alwaysTotalBuyerPays: true,
    forbiddenItemOnlyPrice: true,
    examples: ["BUY NOW • £5.28", "BUY NOW • £25.80", "BUY NOW • £250.40"] as const,
  } as const,

  responsiveMustPass: [
    "IPHONE_17_PRO_MAX",
    "IPHONE",
    "ANDROID",
    "TABLET",
    "DESKTOP",
  ] as const,

  responsiveForbidden: ["OVERFLOW", "CUT_TEXT", "BROKEN_COMPONENTS"] as const,

  whiteScreenForbidden: [
    "WHITE_SCREEN",
    "BLACK_SCREEN",
    "EMPTY_SCREEN",
    "NULL_SCREEN",
  ] as const,

  onFailOnlyShow: [
    "SKELETON",
    "ERROR_COMPONENT",
    "SELF_RECOVERY_COMPONENT",
  ] as const,

  ownerLawMust: [
    "SEE",
    "SCROLL",
    "CLICK",
    "CHAT",
    "BUY",
    "PAY",
    "TRACK",
    "REPORT",
    "REVIEW",
  ] as const,

  productPassRequires: [
    "HEADER_PASS",
    "PRODUCT_CARD_PASS",
    "ORDER_STATUS_PASS",
    "SELLER_INFORMATION_PASS",
    "ORDER_SUMMARY_PASS",
    "OFFER_HISTORY_PASS",
    "CHAT_PASS",
    "MESSAGE_INPUT_PASS",
    "STICKY_CTA_PASS",
    "RESPONSIVE_PASS",
    "WHITE_SCREEN_PASS",
    "OWNER_VISUAL_CERTIFICATION_PASS",
  ] as const,

  ssot: {
    code: "lib/inbox/buyer-conversation-hub-master-ui-freeze-v1.ts",
    rule: ".cursor/rules/buyer-conversation-hub-master-ui-freeze-v1.mdc",
    doc: "docs/modules/inbox/BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.md",
    masterStack: "lib/inbox/master-stack-buyer-hub-v1.ts",
    masterBuyerFreeze: "lib/inbox/master-buyer-conversation-hub-freeze-v1.ts",
  } as const,
} as const;

export type BuyerConversationHubMasterUiFreezeV1 =
  typeof BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1;

/** Product PASS only when every certification pillar is true. */
export function resolveBuyerConversationHubProductPass(input: {
  headerPass: boolean;
  productCardPass: boolean;
  orderStatusPass: boolean;
  sellerInformationPass: boolean;
  orderSummaryPass: boolean;
  offerHistoryPass: boolean;
  chatPass: boolean;
  messageInputPass: boolean;
  stickyCtaPass: boolean;
  responsivePass: boolean;
  whiteScreenPass: boolean;
  ownerVisualCertificationPass: boolean;
}): "PRODUCT_PASS_100" | "PRODUCT_FAIL" {
  const ok = Object.values(input).every(Boolean);
  return ok ? "PRODUCT_PASS_100" : "PRODUCT_FAIL";
}

export function isOwnerLawPassForBuyerHub(
  capabilities: ReadonlyArray<
    (typeof BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.ownerLawMust)[number]
  >,
): boolean {
  return BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.ownerLawMust.every((item) =>
    capabilities.includes(item),
  );
}
