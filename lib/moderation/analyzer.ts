import type { ModerationCategory, ModerationDecision, ModerationHit, ModerationResult } from "@/lib/moderation/types";

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
      /\b(assault rifle|ar-?15|ak-?47|firearm|handgun|pistol|revolver|shotgun|rifle|gun\b|glock|sig sauer|beretta)\b/i,
    ],
  },
  {
    category: "firearm_accessories",
    decision: "blocked",
    weight: 0.95,
    patterns: [/\b(silencer|suppressor|gun magazine|magazine clip|holster rifle|trigger group|ar15 part)\b/i],
  },
  {
    category: "ammunition",
    decision: "blocked",
    weight: 1,
    patterns: [/\b(ammunition|ammo|bullets?|rounds?|9mm|\.22\b|\.45\b|cartridge|shells?\b)\b/i],
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
    patterns: [/\b(bb gun|bb pistol|spring powered gun)\b/i],
  },
  {
    category: "explosives",
    decision: "blocked",
    weight: 1,
    patterns: [/\b(explosive|detonator|tnt|dynamite|firework powder|pyrotechnic|bomb\b|grenade)\b/i],
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
    category: "alcohol",
    decision: "warning",
    weight: 0.55,
    patterns: [/\b(vodka|whisky|whiskey|rum bottle|tequila|home brew kit|moonshine)\b/i],
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
      /\b(whatsapp|telegram|signal|snapchat)\b/i,
    ],
  },
];

const IMAGE_FILENAME_PATTERNS: Array<{ category: ModerationCategory; pattern: RegExp; weight: number }> = [
  { category: "firearms", pattern: /(gun|rifle|pistol|firearm|glock)/i, weight: 0.85 },
  { category: "knives", pattern: /(knife|blade|machete)/i, weight: 0.7 },
  { category: "drugs", pattern: /(pill|powder|narcotic)/i, weight: 0.85 },
  { category: "adult", pattern: /(adult|xxx|nsfw)/i, weight: 0.95 },
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

function buildResult(hits: ModerationHit[]): ModerationResult {
  if (!hits.length) {
    return {
      decision: "approved",
      confidence: 0.99,
      categories: [],
      hits: [],
      summary: "No policy violations detected.",
    };
  }

  const categories = [...new Set(hits.map((hit) => hit.category))];
  const topWeight = Math.max(...hits.map((hit) => hit.weight));
  const blocked = hits.some((hit) =>
    [
      "firearms",
      "firearm_accessories",
      "ammunition",
      "explosives",
      "drugs",
      "counterfeit",
      "adult",
      "stolen_goods",
      "dangerous_chemicals",
      "fake_documents",
      "scam",
    ].includes(hit.category),
  );

  const decision: ModerationDecision = blocked ? "blocked" : "warning";
  const confidence = Math.min(0.99, Math.max(0.55, topWeight));

  return {
    decision,
    confidence,
    categories,
    hits,
    summary: `${decision === "blocked" ? "Blocked" : "Warning"}: ${categories.join(", ")}`,
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
      };
    }
  }
  return null;
}
