/**
 * ROVEXO v1.0 — CANONICAL ROADMAP
 *
 * STATUS: OWNER APPROVED · LOCKED
 * Absolute Functional Law: no PASS/FREEZE/LOCK/NEXT without
 * localhost:3000 + Owner click + visual functional proof.
 */

export const ROVEXO_V1_CANONICAL_ROADMAP = {
  version: "1.0",
  status: "OWNER_APPROVED_LOCKED",
  host: "http://localhost:3000",
  readyWhen: "SPRING_1_THROUGH_10_FROZEN",
} as const;

export const ROVEXO_V1_SPRINGS = [
  {
    id: 1,
    name: "VIEW ENGINE",
    mission: "Owner must see views work (0→1→2, bot/seller blocked).",
    status: "FROZEN",
    ssot: "lib/views/view-engine-spring-1-freeze-v1.ts",
  },
  {
    id: 2,
    name: "TRANSACTION HUB ENGINE",
    mission:
      "Code Blood v2.0: event → realtime badge → notification/message + product image → click → real page → read/unread → Owner visual freeze.",
    status: "IN_DEVELOPMENT_IMPLEMENTATION",
    ssot: "lib/inbox/transaction-hub-spring-2-v1.ts",
  },
  {
    id: 3,
    name: "BUY NOW ENGINE",
    mission: "OWNER MUST BE ABLE TO BUY AN ITEM.",
    status: "PENDING",
  },
  {
    id: 4,
    name: "CHECKOUT ENGINE",
    mission: "OWNER MUST BE ABLE TO COMPLETE CHECKOUT.",
    status: "PENDING",
  },
  {
    id: 5,
    name: "PAYMENT ENGINE",
    mission: "OWNER MUST BE ABLE TO PAY SUCCESSFULLY.",
    status: "PENDING",
  },
  {
    id: 6,
    name: "SHIPPING ENGINE",
    mission: "OWNER MUST SEE SHIPPING WORKING.",
    status: "PENDING",
  },
  {
    id: 7,
    name: "ORDER ENGINE",
    mission: "OWNER MUST SEE THE ORDER CREATED.",
    status: "PENDING",
  },
  {
    id: 8,
    name: "TRACKING ENGINE",
    mission: "OWNER MUST SEE TRACKING WORKING.",
    status: "PENDING",
  },
  {
    id: 9,
    name: "REVIEW ENGINE",
    mission: "OWNER MUST SEE REVIEWS WORKING.",
    status: "PENDING",
  },
  {
    id: 10,
    name: "v1.0 READY GATE",
    mission: "All prior springs frozen with Owner visual proof on localhost:3000.",
    status: "PENDING",
  },
] as const;

export type RovexoV1SpringId = (typeof ROVEXO_V1_SPRINGS)[number]["id"];

export function getRovexoV1Spring(id: RovexoV1SpringId) {
  return ROVEXO_V1_SPRINGS.find((s) => s.id === id)!;
}

/** Active spring = first not FROZEN. */
export function getActiveRovexoV1Spring() {
  return ROVEXO_V1_SPRINGS.find((s) => s.status !== "FROZEN") ?? null;
}
