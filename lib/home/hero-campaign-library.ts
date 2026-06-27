/**
 * ROVEXO local hero campaign library — Launch Candidate.
 * Assets: public/hero/{id}.webp + public/hero/{id}.avif
 */

export const HERO_CAMPAIGN_IDS = [
  "vehicles",
  "property",
  "phones",
  "computers",
  "electronics",
  "fashion",
  "home-garden",
  "luxury",
  "verified-sellers",
  "auctions",
  "seasonal",
] as const;

export type HeroCampaignId = (typeof HERO_CAMPAIGN_IDS)[number];

const CAMPAIGN_SET = new Set<string>(HERO_CAMPAIGN_IDS);

export function isHeroCampaignId(value: string): value is HeroCampaignId {
  return CAMPAIGN_SET.has(value);
}

export function getHeroCampaignWebpSrc(id: HeroCampaignId): string {
  return `/hero/${id}.webp`;
}

export function getHeroCampaignAvifSrc(id: HeroCampaignId): string {
  return `/hero/${id}.avif`;
}

/** Photorealistic briefs for sourcing/regenerating campaign photography */
export const HERO_CAMPAIGN_BRIEFS: Record<HeroCampaignId, string> = {
  vehicles: "Premium red sports car in luxury studio, European marketplace campaign",
  property: "Modern luxury white house, premium real estate campaign photography",
  phones: "Flagship smartphone product hero shot, clean white studio",
  computers: "Premium laptop open on desk, commercial tech campaign",
  electronics: "Premium wireless headphones, luxury electronics campaign",
  fashion: "Luxury leather jacket on mannequin, high-end fashion campaign",
  "home-garden": "Designer living room with sofa and plants, interior campaign",
  luxury: "Luxury gold wristwatch on marble, premium jewellery campaign",
  "verified-sellers": "Professional handshake with trust badge motif, marketplace trust campaign",
  auctions: "Premium auction gavel with spotlight, live bidding campaign",
  seasonal: "Curated gift boxes with ribbon, seasonal promotion campaign",
};
