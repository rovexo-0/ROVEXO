import {
  flattenCategoryPaths,
  toPathId,
} from "@/lib/categories/queries";
import type { FlatCategoryPath } from "@/lib/categories/types";

export type ProductRule = {
  keywords: string[];
  path: [string, string, string];
  productType: string;
  confidence: number;
  material?: string;
  size?: string;
};

/**
 * Vision label → category mappings. Slugs must exist in the marketplace tree.
 * Rules never invent brands — only product type and taxonomy.
 */
export const PRODUCT_RULES: ProductRule[] = [
  {
    keywords: ["car seat", "baby car seat", "isofix", "infant seat"],
    path: ["baby", "pushchairs", "travel-systems"],
    productType: "Car Seat",
    confidence: 0.93,
  },
  {
    keywords: ["smartphone", "mobile phone", "iphone", "galaxy", "android phone"],
    path: ["phones", "smartphones", "unlocked-phones"],
    productType: "Smartphone",
    confidence: 0.92,
  },
  {
    keywords: ["trainer", "sneaker", "running shoe", "footwear", "shoe"],
    path: ["shoes", "trainers", "nike"],
    productType: "Trainers",
    size: "UK 9",
    confidence: 0.91,
  },
  {
    keywords: ["boot", "hiking boot", "leather boot"],
    path: ["mens-fashion", "mens-shoes", "mens-boots"],
    productType: "Boots",
    confidence: 0.88,
  },
  {
    keywords: ["laptop", "macbook", "notebook computer", "chromebook"],
    path: ["computers", "laptops", "macbooks"],
    productType: "Laptop",
    confidence: 0.92,
  },
  {
    keywords: ["television", "tv", "smart tv", "oled", "qled"],
    path: ["electronics", "tv-video", "televisions"],
    productType: "Television",
    confidence: 0.91,
  },
  {
    keywords: ["watch", "smartwatch", "apple watch", "wearable"],
    path: ["phones", "wearables", "smartwatches"],
    productType: "Smartwatch",
    size: "42mm",
    confidence: 0.9,
  },
  {
    keywords: ["bicycle", "road bike", "cycling", "mountain bike"],
    path: ["cycling", "bikes", "road-bikes"],
    productType: "Bicycle",
    size: "54cm",
    confidence: 0.9,
  },
  {
    keywords: ["sofa", "couch", "settee", "chesterfield"],
    path: ["home-garden", "furniture", "sofas"],
    productType: "Sofa",
    material: "Fabric",
    confidence: 0.9,
  },
  {
    keywords: ["toy", "lego", "duplo", "doll", "action figure", "playset"],
    path: ["toys", "building-toys", "lego"],
    productType: "Toy",
    confidence: 0.91,
  },
  {
    keywords: ["book", "paperback", "hardback", "novel", "textbook"],
    path: ["books", "fiction", "crime"],
    productType: "Book",
    confidence: 0.89,
  },
  {
    keywords: ["headphone", "headphones", "earbud", "earbuds", "airpods"],
    path: ["electronics", "audio", "headphones"],
    productType: "Headphones",
    confidence: 0.91,
  },
  {
    keywords: ["jeans", "denim", "levis"],
    path: ["mens-fashion", "mens-clothing", "mens-jeans"],
    productType: "Jeans",
    material: "Denim",
    confidence: 0.88,
  },
  {
    keywords: ["coat", "jacket", "puffer", "parka"],
    path: ["mens-fashion", "mens-clothing", "mens-coats"],
    productType: "Jacket",
    confidence: 0.87,
  },
  {
    keywords: ["handbag", "tote", "leather bag", "purse"],
    path: ["womens-fashion", "womens-bags", "handbags"],
    productType: "Handbag",
    material: "Leather",
    confidence: 0.86,
  },
  {
    keywords: ["vacuum", "dyson", "hoover"],
    path: ["appliances", "cleaning-appliances", "vacuum-cleaners"],
    productType: "Vacuum Cleaner",
    confidence: 0.87,
  },
  {
    keywords: ["playstation", "xbox", "console", "nintendo"],
    path: ["gaming", "consoles", "playstation"],
    productType: "Games Console",
    confidence: 0.9,
  },
];

const allPaths = flattenCategoryPaths();

export function resolvePathSlugs(slugs: [string, string, string?]): FlatCategoryPath | null {
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

export function findRuleForLabels(labels: string[]): ProductRule | null {
  const normalized = labels.map((label) => label.trim().toLowerCase()).filter(Boolean);

  for (const rule of PRODUCT_RULES) {
    const hit = rule.keywords.some((keyword) =>
      normalized.some((label) => label.includes(keyword) || keyword.includes(label)),
    );
    if (hit) return rule;
  }

  return null;
}

export function scorePathAgainstLabels(path: FlatCategoryPath, labels: string[]): number {
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

  return Math.min(score, 0.78);
}

export function matchCategoriesFromLabels(labels: string[]): Array<{
  path: FlatCategoryPath;
  confidence: number;
  productType: string;
  material?: string;
  size?: string;
}> {
  const normalized = labels.map((label) => label.trim().toLowerCase()).filter(Boolean);
  const matches = new Map<
    string,
    { path: FlatCategoryPath; confidence: number; productType: string; material?: string; size?: string }
  >();

  for (const rule of PRODUCT_RULES) {
    const hit = rule.keywords.some((keyword) =>
      normalized.some((label) => label.includes(keyword) || keyword.includes(label)),
    );
    if (!hit) continue;

    const path = resolvePathSlugs(rule.path);
    if (!path) continue;

    const pathId = toPathId(path);
    const existing = matches.get(pathId);
    if (!existing || rule.confidence > existing.confidence) {
      matches.set(pathId, {
        path,
        confidence: rule.confidence,
        productType: rule.productType,
        material: rule.material,
        size: rule.size,
      });
    }
  }

  if (matches.size === 0) {
    for (const path of allPaths) {
      const confidence = scorePathAgainstLabels(path, normalized);
      if (confidence >= 0.5) {
        matches.set(toPathId(path), {
          path,
          confidence,
          productType: path.childCategoryName ?? path.subcategoryName,
        });
      }
    }
  }

  return [...matches.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}
