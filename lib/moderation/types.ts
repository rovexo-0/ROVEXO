export type ModerationDecision = "approved" | "warning" | "blocked";

export type ModerationCategory =
  | "firearms"
  | "firearm_accessories"
  | "ammunition"
  | "knives"
  | "swords"
  | "airsoft"
  | "bb_guns"
  | "explosives"
  | "drugs"
  | "prescription_medicines"
  | "alcohol"
  | "tobacco"
  | "vapes"
  | "counterfeit"
  | "adult"
  | "stolen_goods"
  | "dangerous_chemicals"
  | "fake_documents"
  | "spam"
  | "scam"
  | "duplicate"
  | "off_platform_payment"
  | "contact_info"
  | "external_links"
  | "whatsapp"
  | "telegram"
  | "instagram"
  | "snapchat"
  | "discord"
  | "crypto_scam"
  | "money_laundering"
  | "fake_giveaway"
  | "animal_abuse"
  | "violence"
  | "profanity";

export type ModerationHit = {
  category: ModerationCategory;
  term: string;
  weight: number;
};

export type ModerationResult = {
  decision: ModerationDecision;
  confidence: number;
  categories: ModerationCategory[];
  hits: ModerationHit[];
  summary: string;
};

export type ModerationTarget = "listing" | "listing_image" | "message" | "profile" | "conversation";

export type ModerationQueueItem = {
  id: string;
  targetType: ModerationTarget;
  targetId: string;
  productId: string | null;
  sellerId: string | null;
  source: string;
  decision: ModerationDecision;
  confidence: number;
  categories: ModerationCategory[];
  summary: string;
  status: "pending" | "approved" | "warning" | "blocked" | "overridden";
  payload: Record<string, unknown>;
  createdAt: string;
  reviewedAt: string | null;
  overrideDecision: ModerationDecision | null;
  overrideNotes: string | null;
};

export type ContentReport = {
  id: string;
  reporterId: string;
  targetType: ModerationTarget;
  targetId: string;
  productSlug: string | null;
  reason: string;
  details: string;
  status: ModerationQueueItem["status"];
  createdAt: string;
};
