import type { ModerationCategory, ModerationDecision, ModerationHit } from "@/lib/moderation/types";

export type ModerationRiskLevel = "low" | "medium" | "high" | "critical";

const CRITICAL_CATEGORIES = new Set<ModerationCategory>([
  "firearms",
  "firearm_accessories",
  "ammunition",
  "explosives",
  "drugs",
  "prescription_medicines",
  "adult",
  "stolen_goods",
  "dangerous_chemicals",
  "fake_documents",
  "animal_abuse",
  "violence",
  "hate_speech",
  "fake_image",
]);

const HIGH_CATEGORIES = new Set<ModerationCategory>([
  "counterfeit",
  "scam",
  "crypto_scam",
  "money_laundering",
  "fake_giveaway",
  "crossbows",
  "fireworks",
  "knives",
  "swords",
]);

const MEDIUM_CATEGORIES = new Set<ModerationCategory>([
  "airsoft",
  "bb_guns",
  "pellet_guns",
  "spam",
  "off_platform_payment",
  "contact_info",
  "whatsapp",
  "telegram",
  "external_links",
  "duplicate",
  "alcohol",
  "tobacco",
  "vapes",
]);

export function computeRiskScore(hits: ModerationHit[]): number {
  if (!hits.length) return 0;
  const weighted = hits.reduce((sum, hit) => sum + hit.weight * 100, 0);
  return Math.min(100, Math.round(weighted / hits.length));
}

export function computeRiskLevel(
  hits: ModerationHit[],
  decision: ModerationDecision,
): ModerationRiskLevel {
  if (decision === "approved" || !hits.length) return "low";

  const categories = hits.map((hit) => hit.category);
  if (categories.some((category) => CRITICAL_CATEGORIES.has(category))) return "critical";
  if (categories.some((category) => HIGH_CATEGORIES.has(category))) return "high";
  if (categories.some((category) => MEDIUM_CATEGORIES.has(category))) return "medium";

  const score = computeRiskScore(hits);
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function requiresModerationQueue(riskLevel: ModerationRiskLevel): boolean {
  return riskLevel === "high" || riskLevel === "critical";
}

export function riskLevelLabel(level: ModerationRiskLevel): string {
  switch (level) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "critical":
      return "Critical";
  }
}
