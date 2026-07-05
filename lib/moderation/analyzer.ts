import type { ModerationCategory, ModerationDecision, ModerationHit, ModerationResult } from "@/lib/moderation/types";
import { computeRiskLevel, computeRiskScore } from "@/lib/moderation/risk";

type RuleGroup = {
  category: ModerationCategory;
  decision: ModerationDecision;
  weight: number;
  patterns: RegExp[];
};

const RULE_GROUPS: RuleGroup[] = [
  {
    category: "firearms",
    decision: "blocked",
    weight: 1,
    patterns: [
      /\b(assault rifle|ar-?15|ak-?47|firearm|handgun|pistol|revolver|shotgun|rifle|glock|sig sauer|beretta)\b/i,
      // Bare "gun" only when it is not a common tool/toy/craft compound
      // (nail gun, glue gun, heat gun, spray gun, nerf gun, water gun, etc.).
      /(?<!\b(?:nail|glue|hot|heat|staple|spray|water|squirt|nerf|paintball|foam|toy|t-?shirt|confetti|caulk|grease|price|air)\s)\bgun\b/i,
    ],
  },
  {
    category: "firearm_accessories",
    decision: "blocked",
    weight: 0.95,
    patterns: [
      /\b(silencer|suppressor|gun magazine|magazine clip|holster rifle|trigger group|ar15 part|gun scope mount)\b/i,
    ],
  },
  {
    category: "gun_parts",
    decision: "blocked",
    weight: 0.98,
    patterns: [/\b(gun part|barrel assembly|bolt carrier|lower receiver|upper receiver|firing pin)\b/i],
  },
  {
    category: "scopes",
    decision: "blocked",
    weight: 0.9,
    patterns: [/\b(rifle scope|sniper scope|night vision scope|thermal scope|red dot sight)\b/i],
  },
  {
    category: "magazines",
    decision: "blocked",
    weight: 0.95,
    patterns: [/\b(gun magazine|extended mag|drum magazine|30 round mag|magazine loader)\b/i],
  },
  {
    category: "suppressors",
    decision: "blocked",
    weight: 1,
    patterns: [/\b(sound suppressor|gun suppressor|silencer attachment|moderator rifle)\b/i],
  },
  {
    category: "ammunition",
    decision: "blocked",
    weight: 1,
    // Require genuine ammunition context. Bare words like "round", "shell",
    // "cartridge" and "bullet" appear in ordinary listings (round table, phone
    // shell, ink/game cartridge, bullet journal) and must NOT be blocked.
    patterns: [
      /\b(ammunition|ammo|live rounds?|spent casings?|bullet casings?|shotgun shells?|\d{1,2}\s?gauge shells?|\.22\s?lr|\.223|\.308|\.45\s?acp)\b/i,
      /\b(?:rifle|shotgun|pistol|handgun|gun|firearm)\s+(?:rounds?|shells?|cartridges?|ammo|ammunition)\b/i,
      /\b9\s?mm\s+(?:ammo|ammunition|rounds?|luger|para|cartridges?)\b/i,
    ],
  },
  {
    category: "knives",
    decision: "warning",
    weight: 0.75,
    patterns: [/\b(combat knife|switchblade|butterfly knife|balisong|machete|tactical knife|stiletto)\b/i],
  },
  {
    category: "swords",
    decision: "warning",
    weight: 0.7,
    patterns: [/\b(katana|samurai sword|broad sword|longsword|sword\b)/i],
  },
  {
    category: "airsoft",
    decision: "warning",
    weight: 0.65,
    patterns: [/\b(airsoft|bb rifle|pellet gun|co2 pistol)\b/i],
  },
  {
    category: "bb_guns",
    decision: "warning",
    weight: 0.65,
    patterns: [/\b(bb gun|bb pistol|spring powered gun|pellet gun|co2 rifle)\b/i],
  },
  {
    category: "pellet_guns",
    decision: "warning",
    weight: 0.65,
    patterns: [/\b(pellet gun|air rifle|pcp rifle|break barrel rifle)\b/i],
  },
  {
    category: "crossbows",
    decision: "blocked",
    weight: 0.9,
    patterns: [/\b(crossbow|compound crossbow|crossbow bolts)\b/i],
  },
  {
    category: "explosives",
    decision: "blocked",
    weight: 1,
    patterns: [/\b(explosive|detonator|tnt|dynamite|firework powder|pyrotechnic|bomb\b|grenade)\b/i],
  },
  {
    category: "fireworks",
    decision: "blocked",
    weight: 0.95,
    patterns: [/\b(fireworks|roman candle|bottle rocket|m80 firework|professional pyrotechnics)\b/i],
  },
  {
    category: "drugs",
    decision: "blocked",
    weight: 1,
    patterns: [
      /\b(cocaine|heroin|methamphetamine|crystal meth|mdma|ecstasy|lsd|fentanyl|xanax without prescription|steroids cycle)\b/i,
    ],
  },
  {
    category: "prescription_medicines",
    decision: "blocked",
    weight: 0.95,
    patterns: [/\b(prescription only|pharmacy pills|oxycodone|tramadol|antibiotics without prescription)\b/i],
  },
  {
    category: "alcohol",
    decision: "warning",
    weight: 0.55,
    patterns: [/\b(vodka|whisky|whiskey|rum bottle|tequila|home brew kit|moonshine)\b/i],
  },
  {
    category: "tobacco",
    decision: "warning",
    weight: 0.7,
    patterns: [/\b(cigarettes|rolling tobacco|snus|cigar box)\b/i],
  },
  {
    category: "vapes",
    decision: "warning",
    weight: 0.7,
    patterns: [/\b(vape pen|e-?cig|disposable vape|nicotine liquid)\b/i],
  },
  {
    category: "counterfeit",
    decision: "blocked",
    weight: 0.95,
    patterns: [/\b(replica designer|fake (lv|gucci|rolex|nike)|counterfeit|super copy|1:1 clone)\b/i],
  },
  {
    category: "adult",
    decision: "blocked",
    weight: 1,
    patterns: [/\b(porn|xxx|adult toy|sex toy|escort service|onlyfans content)\b/i],
  },
  {
    category: "stolen_goods",
    decision: "blocked",
    weight: 0.95,
    patterns: [/\b(stolen|hot item|no receipt suspicious|serial removed|icloud locked)\b/i],
  },
  {
    category: "dangerous_chemicals",
    decision: "blocked",
    weight: 1,
    patterns: [/\b(acid drain cleaner bulk|poison|cyanide|chloroform|mercury liquid)\b/i],
  },
  {
    category: "fake_documents",
    decision: "blocked",
    weight: 1,
    patterns: [/\b(fake id|forged passport|counterfeit license|novelty id that scans)\b/i],
  },
  {
    category: "spam",
    decision: "warning",
    weight: 0.6,
    patterns: [/\b(click here now|free money|crypto giveaway|whatsapp me on \+|telegram @)\b/i],
  },
  {
    category: "scam",
    decision: "blocked",
    weight: 0.95,
    patterns: [
      /\b(pay outside|bank transfer only|western union|gift card payment|send deposit first|too good to be true)\b/i,
    ],
  },
  {
    category: "off_platform_payment",
    decision: "warning",
    weight: 0.8,
    patterns: [/\b(pay(?:ment)? outside rovexo|paypal friends|bank transfer direct|cash only no platform)\b/i],
  },
  {
    category: "contact_info",
    decision: "warning",
    weight: 0.7,
    patterns: [
      /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/i,
      /\b(\+?\d[\d\s().-]{7,}\d)\b/,
    ],
  },
  {
    category: "whatsapp",
    decision: "warning",
    weight: 0.85,
    patterns: [/\b(whatsapp|wa\.me|whats app)\b/i],
  },
  {
    category: "telegram",
    decision: "warning",
    weight: 0.85,
    patterns: [/\b(telegram|t\.me\/)\b/i],
  },
  {
    category: "instagram",
    decision: "warning",
    weight: 0.75,
    patterns: [/\b(instagram|insta dm|ig:@)\b/i],
  },
  {
    category: "snapchat",
    decision: "warning",
    weight: 0.75,
    patterns: [/\b(snapchat|snap me)\b/i],
  },
  {
    category: "discord",
    decision: "warning",
    weight: 0.75,
    patterns: [/\b(discord\.gg|discord server)\b/i],
  },
  {
    category: "external_links",
    decision: "warning",
    weight: 0.8,
    patterns: [/\b(https?:\/\/|www\.)\S+/i],
  },
  {
    category: "crypto_scam",
    decision: "blocked",
    weight: 0.95,
    patterns: [/\b(crypto giveaway|send btc|bitcoin doubler|eth giveaway)\b/i],
  },
  {
    category: "money_laundering",
    decision: "blocked",
    weight: 0.95,
    patterns: [/\b(money mule|clean cash|no questions asked transfer)\b/i],
  },
  {
    category: "fake_giveaway",
    decision: "blocked",
    weight: 0.9,
    patterns: [/\b(free iphone giveaway|you won prize|claim reward now)\b/i],
  },
  {
    category: "animal_abuse",
    decision: "blocked",
    weight: 1,
    patterns: [/\b(animal fight|dog fighting|cruelty video)\b/i],
  },
  {
    category: "violence",
    decision: "blocked",
    weight: 0.95,
    patterns: [/\b(kill you|violent attack|assault video)\b/i],
  },
  {
    category: "hate_speech",
    decision: "blocked",
    weight: 0.98,
    patterns: [
      /\b(racial slur|nazi|white power|ethnic cleansing|genocide praise|kill all (?:jews|muslims|blacks|whites))\b/i,
    ],
  },
  {
    category: "fraud_attempt",
    decision: "blocked",
    weight: 0.92,
    patterns: [/\b(identity theft|card skimmer|phishing link|steal password|bank login details)\b/i],
  },
  {
    category: "fake_image",
    decision: "warning",
    weight: 0.75,
    patterns: [/\b(stock photo only|not actual item|rendered image|ai generated photo|placeholder image)\b/i],
  },
];

// These run against image filenames AND the listing title, so every token must
// be word-bounded and specific — unbounded substrings previously matched benign
// words (pill→pillow, powder→washing powder, adult→young adult, scope→telescope,
// sight→insight, gun→shotgun/nail gun) and wrongly blocked/paused listings.
const IMAGE_FILENAME_PATTERNS: Array<{ category: ModerationCategory; pattern: RegExp; weight: number }> = [
  { category: "firearms", pattern: /\b(rifles?|pistols?|firearms?|glock|handguns?)\b/i, weight: 0.85 },
  { category: "knives", pattern: /\b(combat knife|machete|switchblade|butterfly knife)\b/i, weight: 0.7 },
  { category: "drugs", pattern: /\b(narcotics?|cocaine|heroin|crystal meth)\b/i, weight: 0.85 },
  { category: "adult", pattern: /\b(xxx|nsfw|pornographic)\b/i, weight: 0.95 },
  { category: "fake_image", pattern: /\b(stock-?photo|placeholder|mockup)\b/i, weight: 0.8 },
  { category: "scopes", pattern: /\b(rifle ?scope|gun ?sight|red dot sight)\b/i, weight: 0.75 },
];

function normalizeText(input: string): string {
  return input.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

export function analyzeTextContent(text: string): ModerationResult {
  const normalized = normalizeText(text);
  const hits: ModerationHit[] = [];

  for (const group of RULE_GROUPS) {
    for (const pattern of group.patterns) {
      const match = normalized.match(pattern);
      if (match) {
        hits.push({
          category: group.category,
          term: match[0],
          weight: group.weight,
        });
        break;
      }
    }
  }

  return buildResult(hits);
}

export function analyzeImageMetadata(input: {
  fileName?: string;
  altText?: string;
  associatedText?: string;
}): ModerationResult {
  const haystack = normalizeText(
    [input.fileName, input.altText, input.associatedText].filter(Boolean).join(" "),
  );
  const hits: ModerationHit[] = [];

  for (const rule of IMAGE_FILENAME_PATTERNS) {
    const match = haystack.match(rule.pattern);
    if (match) {
      hits.push({ category: rule.category, term: match[0], weight: rule.weight });
    }
  }

  if (haystack) {
    hits.push(...analyzeTextContent(haystack).hits);
  }

  return buildResult(hits);
}

export function analyzeListingContent(input: {
  title: string;
  description: string;
  brand?: string;
  imageNames?: string[];
}): ModerationResult {
  const textResult = analyzeTextContent(
    [input.title, input.description, input.brand].filter(Boolean).join("\n"),
  );

  const imageHits: ModerationHit[] = [];
  for (const name of input.imageNames ?? []) {
    imageHits.push(...analyzeImageMetadata({ fileName: name, associatedText: input.title }).hits);
  }

  return buildResult([...textResult.hits, ...imageHits]);
}

export function analyzeMessageContent(content: string): ModerationResult {
  return analyzeTextContent(content);
}

export function analyzeUsername(username: string): ModerationResult {
  return analyzeTextContent(username);
}

export function analyzeProfileText(input: {
  fullName?: string;
  bio?: string;
}): ModerationResult {
  return analyzeTextContent([input.fullName, input.bio].filter(Boolean).join("\n"));
}

function buildResult(hits: ModerationHit[]): ModerationResult {
  if (!hits.length) {
    return {
      decision: "approved",
      confidence: 0.99,
      categories: [],
      hits: [],
      summary: "No policy violations detected.",
      riskLevel: "low",
      riskScore: 0,
    };
  }

  const categories = [...new Set(hits.map((hit) => hit.category))];
  const topWeight = Math.max(...hits.map((hit) => hit.weight));
  const blocked = hits.some((hit) =>
    [
      "firearms",
      "firearm_accessories",
      "gun_parts",
      "scopes",
      "magazines",
      "suppressors",
      "ammunition",
      "explosives",
      "fireworks",
      "crossbows",
      "drugs",
      "prescription_medicines",
      "counterfeit",
      "adult",
      "stolen_goods",
      "dangerous_chemicals",
      "fake_documents",
      "scam",
      "crypto_scam",
      "money_laundering",
      "fake_giveaway",
      "animal_abuse",
      "violence",
      "hate_speech",
      "fraud_attempt",
    ].includes(hit.category),
  );

  const decision: ModerationDecision = blocked ? "blocked" : "warning";
  const confidence = Math.min(0.99, Math.max(0.55, topWeight));
  const riskScore = computeRiskScore(hits);
  const riskLevel = computeRiskLevel(hits, decision);

  return {
    decision,
    confidence,
    categories,
    hits,
    summary: `${decision === "blocked" ? "Blocked" : "Warning"}: ${categories.join(", ")}`,
    riskLevel,
    riskScore,
  };
}

export function isDuplicateListingText(
  candidate: { title: string; description: string },
  existing: { title: string; description: string }[],
): ModerationResult | null {
  const normalizedCandidate = normalizeText(`${candidate.title} ${candidate.description}`);
  for (const item of existing) {
    const normalizedExisting = normalizeText(`${item.title} ${item.description}`);
    if (
      normalizedCandidate === normalizedExisting ||
      (normalizedCandidate.length > 20 && normalizedExisting.includes(normalizedCandidate))
    ) {
      return {
        decision: "warning",
        confidence: 0.88,
        categories: ["duplicate"],
        hits: [{ category: "duplicate", term: item.title, weight: 0.88 }],
        summary: "Potential duplicate listing detected.",
        riskLevel: "medium",
        riskScore: 88,
      };
    }
  }
  return null;
}
