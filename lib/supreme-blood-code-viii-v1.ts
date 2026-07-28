/**
 * ROVEXO SUPREME BLOOD CODE VIII
 * CONVERSATION HUB PURIFICATION — ABSOLUTE LAW
 *
 * STATUS: PRIORITY 0 · PERMANENT FREEZE APPROVED · 2026-07-23
 * NEVER REMOVE
 *
 * Owner-approved master image = ONLY product.
 * Everything else = FAIL.
 *
 * Purify Conversation Hub: remove search/logo, kill offer/chat duplicates.
 * DO NOT hide with CSS — forbidden components must not exist in the hub.
 */

export const SUPREME_BLOOD_CODE_VIII_V1 = {
  version: "8.0",
  codename: "CONVERSATION_HUB_PURIFICATION",
  status: "PERMANENT_FREEZE_APPROVED",
  priority: 0,
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  permanent: true,
  neverRemove: true,
  priority0: true,
  approvedAt: "2026-07-23",

  onlySourceOfTruth: "OWNER_APPROVED_MASTER_IMAGE",
  everythingElseIsFail: true,

  removeCompletely: [
    "ROVEXO_LOGO",
    "SEARCH_BAR",
    "SEARCH_COMPONENT",
    "SEARCH_CONTAINER",
    "SEARCH_INPUT",
    "SEARCH_ICON",
    "SEARCH_WRAPPER",
    "GLOBAL_SEARCH",
    "HEADER_SEARCH",
    "CONVERSATION_SEARCH",
    "BUYER_SEARCH",
    "SELLER_SEARCH",
  ] as const,

  /** CSS hide is not removal — forbidden. */
  hideTricksForbidden: ["display:none", "visibility:hidden", "opacity:0"] as const,

  /** Must not exist under Conversation Hub / inbox conversation surface. */
  forbiddenHubFiles: [
    "ConversationSearch.tsx",
    "SearchBar.tsx",
    "ConversationHeaderSearch.tsx",
    "HeaderSearch.tsx",
    "OfferAccepted.tsx",
    "OfferAcceptedBubble.tsx",
    "OfferAcceptedMessage.tsx",
    "AcceptedOfferCard.tsx",
    "AcceptedOfferComponent.tsx",
    "SystemOfferAccepted.tsx",
  ] as const,

  headerOnly: ["BACK", "USERNAME", "ACTIVE_STATUS", "INFO_BUTTON"] as const,

  duplicationForbidden: [
    "HEADER_DUPLICATION",
    "SEARCH_DUPLICATION",
    "MESSAGE_DUPLICATION",
    "OFFER_DUPLICATION",
    "DATE_DUPLICATION",
    "STATUS_DUPLICATION",
    "EMPTY_CHAT",
    "WHITE_SCREEN",
    "NULL_SCREEN",
    "BLACK_SCREEN",
  ] as const,

  /** Owner canonical mockup (2026-07-26): ONE unified timeline — offers live in chat. */
  offerHistoryIsOnlyClosedOfferSurface: false,
  chatMustNeverRepeatOfferHistory: false,
  unifiedTimelineIsOnlyOfferSurface: true,
  noSeparateOfferHistory: true,

  masterStack: [
    "HEADER",
    "PRODUCT_CARD",
    "ORDER_STATUS",
    "SELLER_INFORMATION",
    "ORDER_SUMMARY",
    "OFFER_HISTORY",
    "CHAT",
    "MESSAGE_INPUT",
    "BUY_NOW",
    "SAFE_AREA",
  ] as const,

  finalEquation: {
    oneOrder: true,
    oneHub: true,
    onePage: true,
    oneScroll: true,
    oneChat: true,
    oneOfferHistory: true,
    oneMessageInput: true,
    oneBuyNowButton: true,
    oneTruth: true,
  } as const,

  productPassRequires: [
    "SEARCH_BAR_REMOVED",
    "ROVEXO_LOGO_REMOVED",
    "DUPLICATES_REMOVED",
    "HEADER_PASS",
    "CHAT_PASS",
    "MESSAGE_INPUT_PASS",
    "CTA_PASS",
    "RESPONSIVE_PASS",
    "WHITE_SCREEN_PASS",
    "OWNER_VISUAL_PASS",
  ] as const,

  canonicalHub: {
    route: "/inbox/conversation/[conversationId]",
    component: "features/inbox/components/ConversationHub.tsx",
    timelineSsot: "lib/inbox/conversation-view.ts",
  } as const,

  ssot: {
    code: "lib/supreme-blood-code-viii-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-viii-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_VIII_V1.md",
  } as const,

  parentLaws: {
    masterUiFreeze: "lib/inbox/buyer-conversation-hub-master-ui-freeze-v1.ts",
    masterStack: "lib/inbox/master-stack-buyer-hub-v1.ts",
    supremeBloodCodeV: "lib/supreme-blood-code-v-v1.ts",
    supremeBloodCodeVii: "lib/supreme-blood-code-vii-v1.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    priority0: "lib/priority-0-v1.ts",
  } as const,

  childLaws: {
    searchBarRemovalOnly: "lib/supreme-blood-code-ix-v1.ts",
    developmentFreezeLaw: "lib/supreme-blood-code-xi-v1.ts",
    sprintIiiOrdersPermanentFreeze: "lib/supreme-blood-code-xii-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeViiiV1 = typeof SUPREME_BLOOD_CODE_VIII_V1;

/** System / compact offer events — allowed in unified timeline (Owner mockup). */
export const BLOOD_VIII_CHAT_FORBIDDEN_OFFER_EVENTS = [
  /* Empty: accepted/declined system copy is part of the canonical chat mockup. */
] as const;

export function isClosedOfferState(
  state: string,
): state is "accepted" | "declined" | "expired" {
  return state === "accepted" || state === "declined" || state === "expired";
}

/**
 * Unified negotiation timeline (Owner mockup): offers + accept/decline system
 * rows live in chat. Separate Offer History was removed — nothing to omit.
 */
export function shouldOmitOfferFromChatTimeline(_input: {
  kind: string;
  offerState?: string;
  systemEvent?: string;
}): boolean {
  void _input;
  return false;
}

export function resolveBloodViiiProductPass(input: {
  searchBarRemoved: boolean;
  rovexoLogoRemoved: boolean;
  duplicatesRemoved: boolean;
  headerPass: boolean;
  chatPass: boolean;
  messageInputPass: boolean;
  ctaPass: boolean;
  responsivePass: boolean;
  whiteScreenPass: boolean;
  ownerVisualPass: boolean;
}): "PRODUCT_PASS_100" | "PRODUCT_FAIL" {
  return Object.values(input).every(Boolean) ? "PRODUCT_PASS_100" : "PRODUCT_FAIL";
}
