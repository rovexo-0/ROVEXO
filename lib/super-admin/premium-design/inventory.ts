import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { ROVEXO_CATEGORY_PREMIUM_KEYS } from "@/lib/home/category-premium-library";
import { HERO_CAMPAIGN_IDS } from "@/lib/home/hero-campaign-library";
import { PREMIUM_EMPTY_STATE_IDS } from "@/lib/premium-design/empty-state-library";

export type PremiumAssetRecord = {
  id: string;
  category: "category" | "hero" | "empty-state";
  label: string;
  sourcePath: string;
  sourceBytes: number;
  published: boolean;
  formats: string[];
  lastModified: string | null;
  version: string;
};

export type PremiumAssetInventory = {
  scannedAt: string;
  designSystemVersion: string;
  totals: {
    categories: number;
    heroes: number;
    emptyStates: number;
    published: number;
    missing: number;
  };
  assets: PremiumAssetRecord[];
};

async function fileInfo(relativePath: string) {
  const absolute = path.join(process.cwd(), relativePath);
  try {
    const info = await stat(absolute);
    return { exists: true, bytes: info.size, mtime: info.mtime.toISOString() };
  } catch {
    return { exists: false, bytes: 0, mtime: null };
  }
}

async function readVersion(manifestPath: string, fallback: string) {
  try {
    const manifest = JSON.parse(await readFile(path.join(process.cwd(), manifestPath), "utf8")) as {
      version?: string;
      pipeline?: string;
    };
    return manifest.version ?? manifest.pipeline ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getPremiumAssetInventory(): Promise<PremiumAssetInventory> {
  const assets: PremiumAssetRecord[] = [];
  let missing = 0;

  const categoryVersion = await readVersion("public/categories/manifest.json", "unknown");
  for (const id of ROVEXO_CATEGORY_PREMIUM_KEYS) {
    const sourcePath = `public/categories/source/${id}.png`;
    const source = await fileInfo(sourcePath);
    const png = await fileInfo(`public/categories/${id}.png`);
    if (!source.exists || !png.exists) missing += 1;
    assets.push({
      id,
      category: "category",
      label: id.replace(/-/g, " "),
      sourcePath,
      sourceBytes: source.bytes,
      published: source.exists && png.exists,
      formats: ["avif", "webp", "png"],
      lastModified: source.mtime,
      version: categoryVersion,
    });
  }

  const heroVersion = await readVersion("public/hero/manifest.json", "unknown");
  for (const id of HERO_CAMPAIGN_IDS) {
    const sourcePath = `public/hero/source/${id}.png`;
    const source = await fileInfo(sourcePath);
    const webp = await fileInfo(`public/hero/${id}.webp`);
    if (!source.exists || !webp.exists) missing += 1;
    assets.push({
      id,
      category: "hero",
      label: id.replace(/-/g, " "),
      sourcePath,
      sourceBytes: source.bytes,
      published: source.exists && webp.exists,
      formats: ["avif", "webp", "png"],
      lastModified: source.mtime,
      version: heroVersion,
    });
  }

  const emptyVersion = await readVersion("public/assets/empty-states/manifest.json", "unknown");
  for (const id of PREMIUM_EMPTY_STATE_IDS) {
    const sourcePath = `public/assets/empty-states/source/${id}.png`;
    const source = await fileInfo(sourcePath);
    const webp = await fileInfo(`public/assets/empty-states/${id}.webp`);
    if (!source.exists || !webp.exists) missing += 1;
    assets.push({
      id,
      category: "empty-state",
      label: id.replace(/-/g, " "),
      sourcePath,
      sourceBytes: source.bytes,
      published: source.exists && webp.exists,
      formats: ["avif", "webp", "png"],
      lastModified: source.mtime,
      version: emptyVersion,
    });
  }

  return {
    scannedAt: new Date().toISOString(),
    designSystemVersion: "premium-design-system-v1",
    totals: {
      categories: ROVEXO_CATEGORY_PREMIUM_KEYS.length,
      heroes: HERO_CAMPAIGN_IDS.length,
      emptyStates: PREMIUM_EMPTY_STATE_IDS.length,
      published: assets.filter((asset) => asset.published).length,
      missing,
    },
    assets,
  };
}

export async function assetSourceExists(relativePath: string): Promise<boolean> {
  try {
    await access(path.join(process.cwd(), relativePath));
    return true;
  } catch {
    return false;
  }
}
