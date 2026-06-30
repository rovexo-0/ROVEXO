import type { ModerationCategory, ModerationResult } from "@/lib/moderation/types";

const USER_MESSAGES: Partial<Record<ModerationCategory, string>> = {
  firearms: "This content appears to relate to weapons, which are not allowed on ROVEXO.",
  firearm_accessories: "Weapon accessories cannot be listed or shared on ROVEXO.",
  ammunition: "Ammunition and related items are not permitted on ROVEXO.",
  knives: "This content may relate to restricted knives. Please review our prohibited items policy.",
  swords: "Swords and bladed weapons may require review before they can be listed.",
  airsoft: "Airsoft and similar items may be restricted. Please check our seller guidelines.",
  bb_guns: "BB guns and similar items may not be allowed in all categories.",
  explosives: "Explosives and dangerous materials are strictly prohibited.",
  drugs: "Illegal drugs and controlled substances cannot be listed or discussed for sale.",
  prescription_medicines: "Prescription medicines cannot be sold without proper authorisation.",
  alcohol: "Alcohol listings may be restricted depending on category and region.",
  tobacco: "Tobacco products are restricted on ROVEXO.",
  vapes: "Vape and e-cigarette products are restricted on ROVEXO.",
  counterfeit: "Counterfeit or replica items presented as authentic are not allowed.",
  adult: "Adult content and services are not permitted on ROVEXO.",
  stolen_goods: "Stolen or suspicious goods cannot be listed on ROVEXO.",
  dangerous_chemicals: "Dangerous chemicals are prohibited for safety reasons.",
  fake_documents: "Fake or forged documents cannot be listed or offered.",
  spam: "This message looks like spam. Please keep communication relevant to your transaction.",
  scam: "This content may be a scam attempt. Keep payments and communication on ROVEXO.",
  duplicate: "This looks similar to another listing you already have. Duplicate listings are not allowed.",
  off_platform_payment: "Payments must stay on ROVEXO checkout to protect buyers and sellers.",
  contact_info: "Sharing phone numbers, emails, or external contact details reduces buyer protection.",
  external_links: "External links to complete payment or contact outside ROVEXO are not allowed.",
  whatsapp: "Please keep communication on ROVEXO Messages instead of WhatsApp.",
  telegram: "Please keep communication on ROVEXO Messages instead of Telegram.",
  instagram: "Please keep communication on ROVEXO Messages instead of external social apps.",
  snapchat: "Please keep communication on ROVEXO Messages instead of Snapchat.",
  discord: "Please keep communication on ROVEXO Messages instead of Discord.",
  crypto_scam: "Cryptocurrency payment requests outside ROVEXO are not allowed.",
  money_laundering: "This content may relate to suspicious financial activity and was blocked.",
  fake_giveaway: "Fake giveaway or prize scams are not allowed on ROVEXO.",
  animal_abuse: "Content related to animal abuse is not permitted.",
  violence: "Violent content or threats are not allowed on ROVEXO.",
  profanity: "Please keep language respectful in listings and messages.",
};

export type ModerationUserNotice = {
  title: string;
  message: string;
  learnMoreHref: string;
  editListingHref?: string;
  requestReviewHref: string;
};

export function buildModerationUserMessage(result: ModerationResult): string {
  if (result.decision === "approved") {
    return "";
  }

  const primary = result.categories[0];
  if (primary && USER_MESSAGES[primary]) {
    return USER_MESSAGES[primary]!;
  }

  return result.decision === "blocked"
    ? "This action was blocked because it may violate ROVEXO marketplace policies."
    : "This content was flagged for review. Please check it follows ROVEXO guidelines.";
}

export function buildModerationNotice(input: {
  result: ModerationResult;
  listingEditHref?: string;
  productSlug?: string;
}): ModerationUserNotice {
  return {
    title: input.result.decision === "blocked" ? "Action blocked" : "Review required",
    message: buildModerationUserMessage(input.result),
    learnMoreHref: "/help/prohibited-items-list",
    editListingHref: input.listingEditHref,
    requestReviewHref: `/support?category=appeal_moderation${input.productSlug ? `&listing=${encodeURIComponent(input.productSlug)}` : ""}`,
  };
}

export function buildMessageSecurityNotice(result: ModerationResult): string {
  return buildModerationUserMessage(result);
}
