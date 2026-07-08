import type { AssistantPersona } from "@/lib/ai-assistant/marketplace";

export type PersonaProfile = {
  id: AssistantPersona;
  label: string;
  description: string;
  greeting: string;
  focusAreas: string[];
};

export const ASSISTANT_PERSONAS: PersonaProfile[] = [
  {
    id: "buyer",
    label: "Buyer Assistant",
    description: "Checkout, orders, returns, and purchase protection",
    greeting: "I can help with buying, orders, refunds, and purchase protection.",
    focusAreas: ["orders", "buyer", "refunds", "shipping", "payments"],
  },
  {
    id: "seller",
    label: "Seller Assistant",
    description: "Listings, payouts, withdrawals, and promotions",
    greeting: "I can help with selling, wallet withdrawals, listings, and promotions.",
    focusAreas: ["seller", "withdraw", "promoted-listings", "wallet"],
  },
  {
    id: "business",
    label: "Business Assistant",
    description: "Business dashboard, verification, and B2B tools",
    greeting: "I can help with business accounts, verification, leads, and analytics.",
    focusAreas: ["business-accounts", "verification", "request-quote"],
  },
  {
    id: "wholesale",
    label: "Wholesale Assistant",
    description: "MOQ, bulk pricing, RFQ, and suppliers",
    greeting: "I can help with wholesale accounts, RFQ, and verified suppliers.",
    focusAreas: ["wholesale", "request-quote", "suppliers"],
  },
  {
    id: "admin",
    label: "Admin Assistant",
    description: "Operations, moderation, analytics, and trust review",
    greeting: "I can help navigate admin tools for trust, moderation, and analytics.",
    focusAreas: ["reports", "verification", "support"],
  },
];

export function getPersonaProfile(persona: AssistantPersona): PersonaProfile {
  return ASSISTANT_PERSONAS.find((entry) => entry.id === persona) ?? ASSISTANT_PERSONAS[0]!;
}
