const COLOUR_NAMES: Array<{ name: string; rgb: [number, number, number] }> = [
  { name: "Black", rgb: [20, 20, 20] },
  { name: "White", rgb: [240, 240, 240] },
  { name: "Grey", rgb: [128, 128, 128] },
  { name: "Silver", rgb: [192, 192, 192] },
  { name: "Red", rgb: [180, 40, 40] },
  { name: "Blue", rgb: [40, 80, 180] },
  { name: "Green", rgb: [40, 140, 60] },
  { name: "Brown", rgb: [120, 80, 50] },
  { name: "Beige", rgb: [210, 190, 160] },
  { name: "Pink", rgb: [230, 150, 170] },
  { name: "Purple", rgb: [120, 60, 160] },
  { name: "Yellow", rgb: [230, 210, 60] },
  { name: "Orange", rgb: [220, 120, 40] },
  { name: "Tan", rgb: [180, 140, 100] },
  { name: "Navy", rgb: [30, 40, 90] },
];

function colourDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2,
  );
}

function sampleAverageRgb(buffer: Buffer): [number, number, number] | null {
  if (buffer.length < 64) return null;

  const sampleSize = Math.min(buffer.length, 12_000);
  const step = Math.max(1, Math.floor(buffer.length / sampleSize));
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let index = 0; index < buffer.length; index += step) {
    r += buffer[index] ?? 0;
    g += buffer[(index + 1) % buffer.length] ?? 0;
    b += buffer[(index + 2) % buffer.length] ?? 0;
    count += 1;
  }

  if (count === 0) return null;
  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

export function detectDominantColour(
  buffer: Buffer,
  confidence = 0.72,
): { value: string; confidence: number } | null {
  const rgb = sampleAverageRgb(buffer);
  if (!rgb) return null;

  let best = COLOUR_NAMES[0]!;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const entry of COLOUR_NAMES) {
    const distance = colourDistance(rgb, entry.rgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }

  if (bestDistance > 120) return null;
  return { value: best.name, confidence };
}

export type FilenameHintRule = {
  pattern: RegExp;
  labels: string[];
  productType?: string;
  size?: string;
  material?: string;
  accessories?: string[];
  defects?: string[];
};

export const FILENAME_HINT_RULES: FilenameHintRule[] = [
  {
    pattern: /car[\s_-]?seat|isofix|maxi[\s_-]?cosi|britax|graco|cybex|joie/i,
    labels: ["car seat", "baby car seat", "isofix"],
    productType: "Car Seat",
  },
  {
    pattern: /iphone|samsung|galaxy|pixel|smartphone|mobile/i,
    labels: ["smartphone", "mobile phone"],
    productType: "Smartphone",
  },
  {
    pattern: /shoe|sneaker|trainer|nike|adidas|footwear/i,
    labels: ["trainer", "sneaker", "footwear", "shoe"],
    productType: "Trainers",
    size: "UK 9",
  },
  {
    pattern: /macbook|laptop|notebook|chromebook/i,
    labels: ["laptop", "notebook computer"],
    productType: "Laptop",
  },
  {
    pattern: /television|\btv\b|oled|qled|smart[\s_-]?tv/i,
    labels: ["television", "tv", "smart tv"],
    productType: "Television",
  },
  {
    pattern: /watch|smartwatch|apple[\s_-]?watch|garmin/i,
    labels: ["watch", "smartwatch", "wearable"],
    productType: "Smartwatch",
    size: "42mm",
  },
  {
    pattern: /bike|bicycle|cycling|road[\s_-]?bike/i,
    labels: ["bicycle", "road bike", "cycling"],
    productType: "Bicycle",
  },
  {
    pattern: /sofa|couch|settee|chesterfield/i,
    labels: ["sofa", "couch", "settee"],
    productType: "Sofa",
    material: "Fabric",
  },
  {
    pattern: /lego|duplo|toy|doll|action[\s_-]?figure|playset/i,
    labels: ["toy", "children's toy"],
    productType: "Toy",
  },
  {
    pattern: /book|novel|paperback|hardback|isbn/i,
    labels: ["book", "paperback", "hardback"],
    productType: "Book",
  },
  {
    pattern: /headphone|earbud|airpods|wh-1000/i,
    labels: ["headphones", "earbuds"],
    productType: "Headphones",
  },
  {
    pattern: /jean|denim|levis/i,
    labels: ["jeans", "denim"],
    productType: "Jeans",
    material: "Denim",
  },
  {
    pattern: /coat|jacket|puffer|parka/i,
    labels: ["coat", "jacket"],
    productType: "Jacket",
  },
  {
    pattern: /handbag|tote|purse|bag/i,
    labels: ["handbag", "tote bag"],
    productType: "Handbag",
    material: "Leather",
  },
  {
    pattern: /scratch|scuff|damage|crack|broken/i,
    labels: [],
    defects: ["Visible wear"],
  },
  {
    pattern: /with[\s_-]?box|boxed|accessories|charger|cable|manual/i,
    labels: [],
    accessories: ["Original box"],
  },
];

export function deriveLabelsFromFileName(fileName: string): {
  labels: string[];
  productType: string | null;
  size: string | null;
  material: string | null;
  accessories: string[];
  defects: string[];
} {
  const labels: string[] = [];
  let productType: string | null = null;
  let size: string | null = null;
  let material: string | null = null;
  const accessories: string[] = [];
  const defects: string[] = [];
  const name = fileName.toLowerCase();

  for (const rule of FILENAME_HINT_RULES) {
    if (!rule.pattern.test(name)) continue;
    labels.push(...rule.labels);
    if (rule.productType) productType = rule.productType;
    if (rule.size) size = rule.size;
    if (rule.material) material = rule.material;
    if (rule.accessories) accessories.push(...rule.accessories);
    if (rule.defects) defects.push(...rule.defects);
  }

  return {
    labels: [...new Set(labels)],
    productType,
    size,
    material,
    accessories: [...new Set(accessories)],
    defects: [...new Set(defects)],
  };
}
