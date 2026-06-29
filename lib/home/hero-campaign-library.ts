/**

 * ROVEXO local hero campaign library — v1.4 production advertising campaigns.

 * Assets: public/hero/{id}-{width}.{avif,webp,png}

 */



export const HERO_CAMPAIGN_IDS = [

  "move-store",

  "zero-fees",

  "verified-businesses",

  "buy-securely",

  "fast-delivery",

  "electronics-deals",

  "home-garden",

  "premium-auctions",

] as const;



export type HeroCampaignId = (typeof HERO_CAMPAIGN_IDS)[number];



export const HERO_CAMPAIGN_WIDTHS = [768, 1280, 1920, 3840] as const;



export type HeroCampaignWidth = (typeof HERO_CAMPAIGN_WIDTHS)[number];



const CAMPAIGN_SET = new Set<string>(HERO_CAMPAIGN_IDS);



export function isHeroCampaignId(value: string): value is HeroCampaignId {

  return CAMPAIGN_SET.has(value);

}



export function getHeroCampaignWebpSrc(id: HeroCampaignId, width: HeroCampaignWidth = 1920): string {

  if (width === 1920) return `/hero/${id}.webp`;

  return `/hero/${id}-${width}.webp`;

}



export function getHeroCampaignAvifSrc(id: HeroCampaignId, width: HeroCampaignWidth = 1920): string {

  if (width === 1920) return `/hero/${id}.avif`;

  return `/hero/${id}-${width}.avif`;

}



export function getHeroCampaignPngSrc(id: HeroCampaignId, width: HeroCampaignWidth = 1920): string {

  if (width === 1920) return `/hero/${id}.png`;

  return `/hero/${id}-${width}.png`;

}



export function getHeroCampaignSrcSet(

  id: HeroCampaignId,

  format: "avif" | "webp" | "png",

): string {

  const resolver =

    format === "avif"

      ? getHeroCampaignAvifSrc

      : format === "webp"

        ? getHeroCampaignWebpSrc

        : getHeroCampaignPngSrc;



  return HERO_CAMPAIGN_WIDTHS.map((width) => `${resolver(id, width)} ${width}w`).join(", ");

}



/** Production briefs for regenerating campaign masters */

export const HERO_CAMPAIGN_BRIEFS: Record<HeroCampaignId, string> = {
  "move-store": "Move entire store — shipping boxes, devices, marketplace packages, studio photography",
  "zero-fees": "Zero listing fees — premium price tag, cart, gift box, minimal studio",
  "verified-businesses": "Verified businesses — storefront, team, professional marketplace",
  "buy-securely": "Buyer protection — shield, secure checkout, trust photography",
  "fast-delivery": "Fast delivery — van, packages, urban shipping, photorealistic",
  "electronics-deals": "Local marketplace — street market, community shopping, lifestyle",
  "home-garden": "Sell in minutes — mobile listing, seller with phone, quick commerce",
  "premium-auctions": "Grow your business — team collaboration, analytics, scale",
};


