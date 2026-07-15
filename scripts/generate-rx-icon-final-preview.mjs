/**
 * ONE final splash-icon polish preview board (QA only — not shipped).
 * Run after: node scripts/generate-brand-assets.mjs
 *          node scripts/generate-rx-icon-final-preview.mjs
 */
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "reports", "rx-icon-polish-previews");
const iconSrc = join(root, "public", "icons", "icon-512.png");
mkdirSync(outDir, { recursive: true });

async function phoneSplash(w, h, label) {
  const mark = await sharp(iconSrc).resize(128, 128).png().toBuffer();
  const copy = await sharp(
    Buffer.from(`<svg width="${w - 48}" height="160" xmlns="http://www.w3.org/2000/svg">
      <text x="${(w - 48) / 2}" y="44" text-anchor="middle" font-family="Arial Black, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#09090b">ROVE<tspan fill="#7C3AED">X</tspan>O</text>
      <text x="${(w - 48) / 2}" y="84" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="4" fill="#71717A">BUY . SELL . GROW.</text>
      <circle cx="${(w - 48) / 2 - 14}" cy="120" r="3.5" fill="#7C3AED" opacity="0.45"/>
      <circle cx="${(w - 48) / 2}" cy="120" r="3.5" fill="#7C3AED" opacity="0.85"/>
      <circle cx="${(w - 48) / 2 + 14}" cy="120" r="3.5" fill="#7C3AED" opacity="0.45"/>
      <text x="${(w - 48) / 2}" y="152" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#94A3B8">${label}</text>
    </svg>`),
  )
    .png()
    .toBuffer();

  const bezel = 14;
  const inner = await sharp({
    create: { width: w - bezel * 2, height: h - bezel * 2, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([
      { input: mark, top: Math.round((h - bezel * 2) * 0.32), left: Math.round((w - bezel * 2 - 128) / 2) },
      { input: copy, top: Math.round((h - bezel * 2) * 0.32) + 148, left: 10 },
    ])
    .png()
    .toBuffer();

  return sharp({
    create: { width: w, height: h, channels: 3, background: { r: 18, g: 18, b: 20 } },
  })
    .composite([{ input: inner, top: bezel, left: bezel }])
    .png()
    .toBuffer();
}

async function main() {
  const heroIcon = await sharp(iconSrc).resize(220, 220).png().toBuffer();
  const iphone = await phoneSplash(320, 680, "iPhone");
  const samsung = await phoneSplash(320, 680, "Samsung");
  const title = await sharp(
    Buffer.from(`<svg width="1100" height="80" xmlns="http://www.w3.org/2000/svg">
      <text x="550" y="36" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#0B1224">ROVEXO Splash Icon — Final Polish Preview</text>
      <text x="550" y="64" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#64748B">Official RX · Splash · iPhone · Samsung — awaiting user approval</text>
    </svg>`),
  )
    .png()
    .toBuffer();

  const iconCaption = await sharp(
    Buffer.from(`<svg width="260" height="40" xmlns="http://www.w3.org/2000/svg">
      <text x="130" y="26" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="600" fill="#475569">Official RX Icon</text>
    </svg>`),
  )
    .png()
    .toBuffer();

  await sharp({
    create: { width: 1100, height: 820, channels: 3, background: { r: 246, g: 247, b: 250 } },
  })
    .composite([
      { input: title, top: 24, left: 0 },
      { input: heroIcon, top: 130, left: 72 },
      { input: iconCaption, top: 370, left: 52 },
      { input: iphone, top: 110, left: 380 },
      { input: samsung, top: 110, left: 730 },
    ])
    .png()
    .toFile(join(outDir, "FINAL-splash-icon-preview.png"));

  console.log("OK — reports/rx-icon-polish-previews/FINAL-splash-icon-preview.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
