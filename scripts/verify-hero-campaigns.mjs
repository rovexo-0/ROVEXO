/**
 * Fails if hero campaigns are missing or constants still reference Unsplash.
 * Run: node scripts/verify-hero-campaigns.mjs
 */
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const HERO_DIR = path.join(process.cwd(), "public/hero");
const CAMPAIGNS = [
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
];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const missing = [];
  const invalid = [];

  for (const id of CAMPAIGNS) {
    for (const ext of ["webp", "avif"]) {
      const assetPath = path.join(HERO_DIR, `${id}.${ext}`);
      if (!(await exists(assetPath))) {
        missing.push(`${id}.${ext}`);
        continue;
      }
      const { size } = await stat(assetPath);
      if (size < 4096) invalid.push(`${id}.${ext} (${size} bytes)`);
    }
  }

  const constants = await readFile(path.join(process.cwd(), "lib/home/constants.ts"), "utf8");
  if (constants.includes("unsplash.com")) {
    invalid.push("lib/home/constants.ts still references unsplash.com");
  }

  const heroImages = await readFile(path.join(process.cwd(), "lib/home/hero-images.ts"), "utf8");
  if (heroImages.includes("unsplash.com")) {
    invalid.push("lib/home/hero-images.ts still references unsplash.com");
  }

  if (missing.length > 0 || invalid.length > 0) {
    console.error("\n[ROVEXO] Hero campaign library incomplete.\n");
    if (missing.length > 0) {
      console.error("Missing:");
      for (const item of missing) console.error(`  - public/hero/${item}`);
    }
    if (invalid.length > 0) {
      console.error("Invalid:");
      for (const item of invalid) console.error(`  - ${item}`);
    }
    console.error("\nRun: node scripts/generate-hero-campaigns.mjs\n");
    process.exit(1);
  }

  console.log(`✓ All ${CAMPAIGNS.length} local hero campaigns verified (WebP + AVIF)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
