/**
 * Builds premium landscape hero PNG sources from category WebP assets + cinematic gradients.
 * Output: public/hero/source/{campaign}.png
 * Run: node scripts/generate-hero-campaign-sources.mjs
 */
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WIDTH = 1920;
const HEIGHT = 1080;
const HERO_SOURCE = path.join(process.cwd(), "public/hero/source");
const CATEGORY_DIR = path.join(process.cwd(), "public/categories/home");

/** Campaign id → category icon asset (falls back to services for trust campaigns) */
const CAMPAIGN_ICONS = {
  vehicles: "vehicles",
  property: "property",
  phones: "phones",
  computers: "computers",
  electronics: "electronics",
  fashion: "fashion",
  "home-garden": "home-garden",
  luxury: "luxury",
  "verified-sellers": "services",
  auctions: "luxury",
  seasonal: "sports",
};

/** Premium commercial gradient palettes per campaign */
const CAMPAIGN_THEMES = {
  vehicles: { stops: ["#0b1220", "#1e3a8a", "#2563eb"], accent: "#60a5fa" },
  property: { stops: ["#0f172a", "#312e81", "#4338ca"], accent: "#818cf8" },
  phones: { stops: ["#0c1222", "#0e7490", "#0891b2"], accent: "#22d3ee" },
  computers: { stops: ["#0f1020", "#4c1d95", "#6d28d9"], accent: "#a78bfa" },
  electronics: { stops: ["#101828", "#3730a3", "#6366f1"], accent: "#818cf8" },
  fashion: { stops: ["#111827", "#0f766e", "#14b8a6"], accent: "#5eead4" },
  "home-garden": { stops: ["#0f1a14", "#14532d", "#059669"], accent: "#34d399" },
  luxury: { stops: ["#120f1a", "#581c87", "#7e22ce"], accent: "#c084fc" },
  "verified-sellers": { stops: ["#0b1220", "#1d4ed8", "#2563eb"], accent: "#93c5fd" },
  auctions: { stops: ["#0f1419", "#1e40af", "#1d4ed8"], accent: "#60a5fa" },
  seasonal: { stops: ["#101820", "#047857", "#10b981"], accent: "#6ee7b7" },
};

function buildGradientSvg(theme) {
  const [a, b, c] = theme.stops;
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${a}"/>
          <stop offset="52%" stop-color="${b}"/>
          <stop offset="100%" stop-color="${c}"/>
        </linearGradient>
        <radialGradient id="glow" cx="78%" cy="28%" r="48%">
          <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="shade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#020617" stop-opacity="0.72"/>
          <stop offset="42%" stop-color="#020617" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0.08"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
      <rect width="100%" height="100%" fill="url(#shade)"/>
    </svg>
  `);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildCampaignSource(id) {
  const theme = CAMPAIGN_THEMES[id];
  const iconKey = CAMPAIGN_ICONS[id];
  const iconPath = path.join(CATEGORY_DIR, `${iconKey}.webp`);

  if (!(await fileExists(iconPath))) {
    throw new Error(`Missing category icon for ${id}: ${iconPath}`);
  }

  const gradient = await sharp(buildGradientSvg(theme)).png().toBuffer();
  const iconSize = Math.round(HEIGHT * 0.62);
  const iconLeft = Math.round(WIDTH * 0.54);
  const iconTop = Math.round((HEIGHT - iconSize) / 2);

  const icon = await sharp(iconPath)
    .resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const shadow = await sharp({
    create: {
      width: iconSize,
      height: iconSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.35 },
    },
  })
    .blur(28)
    .png()
    .toBuffer();

  const outputPath = path.join(HERO_SOURCE, `${id}.png`);

  await sharp(gradient)
    .composite([
      { input: shadow, left: iconLeft + 12, top: iconTop + 24, blend: "multiply" },
      { input: icon, left: iconLeft, top: iconTop },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`✓ ${id}.png`);
}

async function main() {
  await mkdir(HERO_SOURCE, { recursive: true });

  for (const id of Object.keys(CAMPAIGN_ICONS)) {
    await buildCampaignSource(id);
  }

  console.log(`\nGenerated ${Object.keys(CAMPAIGN_ICONS).length} hero source PNGs → public/hero/source/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
