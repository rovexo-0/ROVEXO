/**
 * ROVEXO v1.0 — Account premium 3D icon exporter.
 *
 * Reads approved transparent 3D master PNGs and produces the responsive webp/png
 * variants the account page consumes. Each master is alpha-trimmed then re-centred
 * on a square transparent canvas with a fixed margin so every icon carries identical
 * optical weight regardless of the raw render's framing.
 *
 *   public/icons/premium/account/source/{key}.png
 *     -> public/icons/premium/account/{key}[-{size}].{webp,png}   (64,128,256)
 *
 * Run: node scripts/generate-account-premium-icons.mjs
 */
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const ACCOUNT_ROOT = path.join(ROOT, "public/icons/premium/account");
const ACCOUNT_SOURCE = path.join(ACCOUNT_ROOT, "source");

const KEYS = [
  "shopping",
  "wallet",
  "security",
  "analytics",
  "marketplace",
  "feedback",
  "response",
  "orders",
  "cases",
  "listings",
  "messages",
  "business",
  "seller",
  "buyer",
  "settings",
  "help",
  "notification",
  "eye",
  "calendar",
];

const SIZES = [64, 128, 256];
const CONTENT_RATIO = 0.86;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Trim transparent margins then re-centre on a padded square transparent canvas. */
async function normaliseToSquareMaster(sourceBuffer) {
  let content = sourceBuffer;
  try {
    content = await sharp(sourceBuffer).trim({ threshold: 12 }).toBuffer();
  } catch {
    content = sourceBuffer;
  }

  const meta = await sharp(content).metadata();
  const maxSide = Math.max(meta.width ?? 1, meta.height ?? 1);
  const canvas = Math.round(maxSide / CONTENT_RATIO);

  return sharp({
    create: { width: canvas, height: canvas, channels: 4, background: TRANSPARENT },
  })
    .composite([{ input: content, gravity: "center" }])
    .png()
    .toBuffer();
}

async function main() {
  const largest = Math.max(...SIZES);
  console.log("Exporting premium 3D account icons…");

  for (const key of KEYS) {
    const sourcePath = path.join(ACCOUNT_SOURCE, `${key}.png`);
    if (!(await exists(sourcePath))) {
      throw new Error(`[ROVEXO] Missing account master: ${sourcePath}`);
    }
    const master = await normaliseToSquareMaster(await readFile(sourcePath));

    for (const size of SIZES) {
      const suffix = size === largest ? "" : `-${size}`;
      const pipeline = sharp(master).resize(size, size, { fit: "contain", background: TRANSPARENT });
      const target = path.join(ACCOUNT_ROOT, `${key}${suffix}`);
      await pipeline.clone().webp({ quality: 93, effort: 6, alphaQuality: 100 }).toFile(`${target}.webp`);
      await pipeline.clone().png({ compressionLevel: 9 }).toFile(`${target}.png`);
    }
    console.log(`✓ account ${key}`);
  }

  console.log(`\n✓ Done: ${KEYS.length} account icons (webp/png @ ${SIZES.join("/")}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
