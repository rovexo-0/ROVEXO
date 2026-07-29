/**
 * ROVEXO PLATFORM INTEGRATION — P0 SECURITY & INTEGRATION CERTIFICATION v1.0
 *
 * Cod Sânge — resolves genuine production blockers from Platform Integration Audit.
 * Architecture Scope Locks for Clusters 1–9 are preserved (no redesign).
 */

export const PLATFORM_INTEGRATION_P0_SECURITY_CERTIFICATION_V1 = {
  version: "1.0",
  id: "platform-integration-p0-security-integration-certification-v1",
  status: "P0_SECURITY_INTEGRATION_CERTIFIED",
  productionIntegrationReady: true,

  shippingOwnership: {
    assert: "lib/shipping/assert-order-shipping-access.server.ts",
    gatedRoutes: [
      "GET /api/shipping/labels",
      "GET /api/shipping?orderId=",
      "POST /api/shipping/quotes",
    ] as const,
    rule: "Authenticated participant (buyer OR seller) required before admin-client shipping reads/writes",
    reject: [
      "arbitrary orderId",
      "IDOR",
      "admin-client bypass without ownership",
      "hidden ownership bypass",
    ] as const,
  },

  adminStatus: {
    function: "lib/admin/queries.ts → adminUpdateOrderStatus",
    policy: "FAIL_CLOSED_NO_RAW_STATUS_MUTATION",
    rule: "Direct raw order status updates are forbidden; commerce lifecycle owns transitions",
    auditAction: "admin.order_status_mutation_rejected",
  },

  checkoutAuthority: {
    equation: "BUY_NOW_ENGINE → CHECKOUT_UI → CONFIRM_AND_PAY (createOrderCheckoutSession)",
    startMutation: {
      api: "POST /api/checkout/buy-now",
      engine: "BUY_NOW_ENGINE",
      role: "CANONICAL_ORDER_TRANSACTION_SESSION_CREATE",
    },
    payMutation: {
      api: "POST /api/orders/checkout",
      engine: "createOrderCheckoutSession",
      role: "CANONICAL_CONFIRM_AND_PAY_ONLY",
      requires: ["checkoutSessionId OR awaiting_payment orderId from Buy Now"],
    },
    forbidden: [
      "Parallel order create without Buy Now session",
      "Second payment mutation authority",
      "Legacy createOrder() as live checkout path",
    ] as const,
  },

  shippingAuthority: {
    shippingOwns: [
      "shipping lifecycle",
      "shipping labels",
      "tracking",
      "delivery ops",
    ] as const,
    ordersOwns: [
      "order lifecycle",
      "payment state",
      "escrow state",
    ] as const,
    notifications: "Orders wrappers emit ship/deliver via Cluster 8 emitSmartNotification",
  },
} as const;
