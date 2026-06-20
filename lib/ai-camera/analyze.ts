import {
  flattenCategoryPaths,
  toPathId,
} from "@/lib/categories/queries";
import type { FlatCategoryPath } from "@/lib/categories/types";
import {
  AI_CAMERA_CONFIDENCE_THRESHOLD,
  type AiCameraAnalysisResult,
  type CategoryMatchResult,
  type DetectedAttribute,
} from "@/lib/ai-camera/types";

type KeywordRule = {
  keywords: string[];
  path: [string, string, string?];
  brand?: string;
  color?: string;
  size?: string;
  confidence: number;
};

/**
 * Vision label → existing category tree mappings.
 * Rules MUST only reference slugs that exist in categoryTree.
 */
const KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: ["sneaker", "trainer", "running shoe", "air max", "footwear", "shoe"],
    path: ["fashion", "shoes", "trainers"],
    brand: "Nike",
    color: "White",
    size: "UK 9",
    confidence: 0.92,
  },
  {
    keywords: ["boot", "hiking boot", "leather boot"],
    path: ["fashion", "shoes", "boots"],
    brand: "Timberland",
    color: "Brown",
    size: "UK 8",
    confidence: 0.87,
  },
  {
    keywords: ["jeans", "denim", "levis", "501"],
    path: ["fashion", "clothing", "jeans"],
    brand: "Levi's",
    color: "Blue",
    size: "W32 L32",
    confidence: 0.89,
  },
  {
    keywords: ["coat", "jacket", "puffer", "parka"],
    path: ["fashion", "clothing", "coats"],
    brand: "North Face",
    color: "Black",
    size: "M",
    confidence: 0.86,
  },
  {
    keywords: ["handbag", "tote", "leather bag", "purse"],
    path: ["fashion", "accessories", "bags"],
    brand: "Coach",
    color: "Tan",
    confidence: 0.84,
  },
  {
    keywords: ["headphone", "headphones", "over-ear", "wh-1000", "bose", "earbud", "earbuds"],
    path: ["electronics", "audio", "headphones"],
    brand: "Sony",
    color: "Black",
    confidence: 0.91,
  },
  {
    keywords: ["smartphone", "iphone", "galaxy", "mobile phone"],
    path: ["electronics", "phones-tablets", "smartphones"],
    brand: "Apple",
    color: "Space Grey",
    confidence: 0.9,
  },
  {
    keywords: ["watch", "apple watch", "smartwatch", "wearable"],
    path: ["electronics", "phones-tablets", "wearables"],
    brand: "Apple",
    color: "Silver",
    size: "44mm",
    confidence: 0.88,
  },
  {
    keywords: ["laptop", "macbook", "notebook computer"],
    path: ["electronics", "computing", "laptops"],
    brand: "Apple",
    color: "Silver",
    confidence: 0.9,
  },
  {
    keywords: ["vacuum", "dyson", "cleaner"],
    path: ["home-garden", "appliances", "cleaning"],
    brand: "Dyson",
    color: "Purple",
    confidence: 0.87,
  },
  {
    keywords: ["road bike", "bicycle", "cycling"],
    path: ["vehicles", "bikes", "road-bikes"],
    brand: "Specialized",
    color: "Red",
    size: "54cm",
    confidence: 0.85,
  },
  {
    keywords: ["lego", "building blocks", "bricks"],
    path: ["toys", "building-blocks", "lego-bricks"],
    brand: "LEGO",
    color: "Multi",
    confidence: 0.93,
  },
  {
    keywords: ["playstation", "xbox", "console", "video game"],
    path: ["toys", "games", "video-games"],
    brand: "Sony",
    color: "White",
    confidence: 0.88,
  },
  {
    keywords: ["polaroid", "vintage camera", "film camera"],
    path: ["collectibles", "vintage", "cameras"],
    brand: "Polaroid",
    color: "Black",
    confidence: 0.83,
  },
  {
    keywords: ["kindle", "e-reader", "book reader"],
    path: ["electronics", "computing", "accessories"],
    brand: "Amazon",
    color: "Black",
    confidence: 0.82,
  },
];

const allPaths = flattenCategoryPaths();

function resolvePathSlugs(slugs: [string, string, string?]): FlatCategoryPath | null {
  const [categorySlug, subcategorySlug, childSlug] = slugs;
  return (
    allPaths.find(
      (path) =>
        path.categorySlug === categorySlug &&
        path.subcategorySlug === subcategorySlug &&
        (childSlug ? path.childCategorySlug === childSlug : !path.childCategorySlug),
    ) ?? null
  );
}

function scorePathAgainstLabels(path: FlatCategoryPath, labels: string[]): number {
  const haystack = [
    path.categoryName,
    path.subcategoryName,
    path.childCategoryName ?? "",
    path.pathLabel,
    ...labels,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0.35;

  for (const label of labels) {
    if (haystack.includes(label)) score += 0.12;
    if (path.categoryName.toLowerCase().includes(label)) score += 0.08;
    if (path.subcategoryName.toLowerCase().includes(label)) score += 0.1;
    if (path.childCategoryName?.toLowerCase().includes(label)) score += 0.12;
  }

  return Math.min(score, 0.79);
}

function buildAttribute(value: string | undefined, confidence: number): DetectedAttribute | null {
  if (!value) return null;
  return { value, confidence };
}

export function matchCategoriesFromLabels(labels: string[]): CategoryMatchResult[] {
  const normalized = labels.map((label) => label.trim().toLowerCase()).filter(Boolean);
  const matches = new Map<string, CategoryMatchResult>();

  for (const rule of KEYWORD_RULES) {
    const hit = rule.keywords.some((keyword) =>
      normalized.some((label) => label.includes(keyword) || keyword.includes(label)),
    );
    if (!hit) continue;

    const path = resolvePathSlugs(rule.path);
    if (!path) continue;

    const pathId = toPathId(path);
    const existing = matches.get(pathId);
    const confidence = rule.confidence;

    if (!existing || confidence > existing.confidence) {
      matches.set(pathId, { path, confidence });
    }
  }

  if (matches.size === 0) {
    for (const path of allPaths) {
      const confidence = scorePathAgainstLabels(path, normalized);
      if (confidence >= 0.45) {
        matches.set(toPathId(path), { path, confidence });
      }
    }
  }

  return [...matches.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

function pickAttributesFromTopMatch(
  labels: string[],
  topMatch: CategoryMatchResult | undefined,
): {
  brand: DetectedAttribute | null;
  color: DetectedAttribute | null;
  size: DetectedAttribute | null;
  title: DetectedAttribute | null;
  description: DetectedAttribute | null;
} {
  if (!topMatch) {
    return { brand: null, color: null, size: null, title: null, description: null };
  }

  const rule = KEYWORD_RULES.find((entry) => {
    const path = resolvePathSlugs(entry.path);
    return path && toPathId(path) === toPathId(topMatch.path);
  });

  const confidence = topMatch.confidence;
  const itemName = topMatch.path.childCategoryName ?? topMatch.path.subcategoryName;
  const brandName = rule?.brand ?? "Premium";
  const colorName = rule?.color ?? "";
  const sizeValue = rule?.size;

  const titleValue =
    rule && "title" in rule && typeof (rule as { title?: string }).title === "string"
      ? (rule as { title: string }).title
      : [brandName, itemName, colorName ? `— ${colorName}` : "", sizeValue ? `· ${sizeValue}` : ""]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

  const descriptionValue = `${titleValue}. Authentic ${topMatch.path.pathLabel} item from a trusted ROVEXO seller. Carefully inspected before listing. Packaged securely for tracked delivery. Message for measurements or additional photos.`;

  return {
    brand: buildAttribute(rule?.brand, confidence),
    color: buildAttribute(rule?.color, confidence * 0.95),
    size: buildAttribute(rule?.size, rule?.size ? confidence * 0.9 : 0),
    title: buildAttribute(titleValue, confidence),
    description: buildAttribute(descriptionValue, confidence * 0.92),
  };
}

export function buildAnalysisResult(labels: string[]): AiCameraAnalysisResult {
  const matches = matchCategoriesFromLabels(labels);
  const topMatch = matches[0] ?? null;
  const autoSelected = Boolean(topMatch && topMatch.confidence >= AI_CAMERA_CONFIDENCE_THRESHOLD);
  const attributes = pickAttributesFromTopMatch(labels, topMatch ?? undefined);

  return {
    matches,
    selected: autoSelected ? topMatch : null,
    autoSelected,
    brand: attributes.brand,
    color: attributes.color,
    size: attributes.size,
    title: attributes.title,
    description: attributes.description,
    labels,
  };
}

/**
 * Derive mock vision labels from image bytes for Beta inference pipeline.
 * Replace this function with a real vision model — keep matchCategoriesFromLabels().
 */
export function deriveVisionLabels(imageBuffer: Buffer, fileName?: string): string[] {
  const labels: string[] = [];
  const name = (fileName ?? "").toLowerCase();

  const nameHints: Array<[RegExp, string[]]> = [
    [/shoe|sneaker|trainer|nike|adidas/i, ["sneaker", "trainer", "footwear", "shoe"]],
    [/headphone|earbud|audio|sony|bose/i, ["headphone", "headphones", "earbud"]],
    [/phone|iphone|samsung|mobile/i, ["smartphone", "mobile phone"]],
    [/watch|wearable/i, ["watch", "apple watch", "wearable"]],
    [/laptop|macbook/i, ["laptop", "macbook"]],
    [/jean|denim|levis/i, ["jeans", "denim"]],
    [/coat|jacket|puffer/i, ["coat", "jacket", "puffer"]],
    [/bag|tote|handbag/i, ["handbag", "tote", "leather bag"]],
    [/bike|bicycle/i, ["road bike", "bicycle"]],
    [/lego|brick/i, ["lego", "building blocks"]],
    [/playstation|xbox|console/i, ["playstation", "console", "video game"]],
    [/polaroid|camera/i, ["polaroid", "vintage camera"]],
    [/vacuum|dyson/i, ["vacuum", "dyson"]],
    [/kindle|reader/i, ["kindle", "e-reader"]],
  ];

  for (const [pattern, hints] of nameHints) {
    if (pattern.test(name)) labels.push(...hints);
  }

  if (labels.length === 0) {
    const seed = imageBuffer.reduce((sum, byte, index) => sum + byte * (index + 1), 0);
    const fallbackSets = [
      ["sneaker", "trainer", "footwear"],
      ["headphone", "headphones"],
      ["jeans", "denim"],
      ["coat", "jacket"],
      ["smartphone", "mobile phone"],
    ];
    labels.push(...fallbackSets[seed % fallbackSets.length]!);
  }

  return [...new Set(labels)];
}

export function analyzeImageBuffer(imageBuffer: Buffer, fileName?: string): AiCameraAnalysisResult {
  const labels = deriveVisionLabels(imageBuffer, fileName);
  return buildAnalysisResult(labels);
}
