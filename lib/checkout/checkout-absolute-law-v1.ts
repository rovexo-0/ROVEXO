/**
 * ROVEXO CHECKOUT ABSOLUTE LAW v1.0 — FINAL LOCK · OWNER LOCKED
 *
 * 1 PRODUCT = 1 ORDER = 1 TRANSACTION = 1 TRANSACTION CONVERSATION
 *   = 1 PAYMENT LIFECYCLE = 1 FINISHED = 1 SSOT
 *
 * DONE must not exist until every readiness gate is PASS.
 */

export const CHECKOUT_ABSOLUTE_LAW_V1 = {
  version: "1.0",
  status: "FINAL_LOCK",
  ownerApproved: true,
  ownerLocked: true,
  priority: "P1",
  nothingHigherThan: [
    "BUY_NOW",
    "CHECKOUT",
    "PAYMENT",
    "TRANSACTION_CONVERSATION",
  ] as const,

  ssot: {
    equation:
      "1 PRODUCT = 1 ORDER = 1 TRANSACTION = 1 TRANSACTION CONVERSATION = 1 PAYMENT LIFECYCLE = 1 FINISHED",
  } as const,

  canonicalFlow: [
    "BUY_NOW",
    "CHECKOUT",
    "PAY",
    "PAYMENT_SUCCESSFUL",
    "PAYMENT_CAPTURED",
    "ORDER_CREATED",
    "TRANSACTION_CREATED",
    "TRANSACTION_CONVERSATION_CREATED",
    "SYSTEM_MESSAGES_CREATED",
    "DONE_ENABLED",
    "DONE",
    "AUTO_OPEN",
    "TRANSACTION_CONVERSATION",
    "SELLER_PREPARING_ORDER",
    "WAITING_SHIPMENT",
    "ORDER_SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FINISHED",
  ] as const,

  doneLaw: {
    onlyBehaviour: "AUTO_OPEN_TRANSACTION_CONVERSATION" as const,
    destinationTemplate: "/inbox/conversation/{conversation_id}" as const,
    /** DONE must not exist until allPass. */
    requiredGates: [
      "PAYMENT_CAPTURED",
      "ORDER_CREATED",
      "TRANSACTION_CREATED",
      "TRANSACTION_CONVERSATION_CREATED",
      "SYSTEM_MESSAGES_CREATED",
      "PAYMENT_LIFECYCLE_CREATED",
    ] as const,
    ifOneFails: "DONE_DISABLED_OR_ABSENT" as const,
    ifAllPass: "DONE_ENABLED" as const,
    failBehaviour: "STAY_SILENT_POLL" as const,
    failFallback: null,
    goldenRule:
      "If the user can see DONE, ROVEXO guarantees payment + order + transaction + conversation + system messages + lifecycle exist.",
    forbiddenDestinations: [
      "HOME",
      "ORDERS",
      "INBOX",
      "CONTINUE_SHOPPING",
      "VIEW_ORDER",
      "TRACK_ORDER",
      "ORDER_NUMBERS",
      "TRANSACTION_IDS",
      "RESERVATION_IDS",
      "LOADING",
      "PLEASE_TRY_AGAIN",
      "CONVERSATION_NOT_FOUND",
      "EMPTY_CONVERSATION",
      "USER_DESTINATION_PICKER",
      "INBOX_FALLBACK",
    ] as const,
  } as const,

  successPage: {
    required: [
      "CHECKMARK",
      "PAYMENT_SUCCESSFUL",
      "THANK_YOU_SHOPPING_ROVEXO",
      "PRODUCT_TITLE",
      "TOTAL_AMOUNT",
      "DONE_WHEN_GATES_PASS",
      "SECURE_CHECKOUT",
    ] as const,
    doneEqualsTransactionConversation: true,
  } as const,

  paymentMethodsV1: ["CARD_VISA_MASTERCARD", "ROVEXO_BALANCE"] as const,

  buyerConversationLifecycle: [
    "PAYMENT_SUCCESSFUL",
    "SELLER_PREPARING_ORDER",
    "WAITING_SHIPMENT",
    "ORDER_SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FINISHED",
  ] as const,

  sellerConversationLifecycle: [
    "NEW_ORDER_RECEIVED",
    "PAYMENT_RECEIVED",
    "PREPARE_ORDER",
    "WAITING_SHIPMENT",
    "ORDER_SHIPPED",
    "DELIVERED",
    "FINISHED",
  ] as const,

  surfaces: {
    doneGate: "lib/checkout/done-readiness-gate-v1.ts",
    doneReadyApi: "app/api/checkout/done-ready/route.ts",
    successView: "features/checkout/components/CheckoutSuccessView.tsx",
    successRoute: "app/checkout/[slug]/success/page.tsx",
    conversationHub: "features/inbox/components/ConversationHub.tsx",
  } as const,
} as const;

/** @deprecated */
export const CHECKOUT_ABSOLUTE_LAW_DONE_EQUALS_MESSAGES = true;

export type CheckoutAbsoluteLawV1 = typeof CHECKOUT_ABSOLUTE_LAW_V1;
