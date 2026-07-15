/**
 * ONE final RX icon approval preview (QA only — not shipped).
 * Shows: Official RX · Splash · iPhone · Samsung · PWA · Favicon
 * Run: node scripts/generate-brand-assets.mjs && node scripts/generate-rx-icon-final-preview.mjs
 */
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "reports", "rx-icon-polish-previews");
const iconSrc = join(root, "public", "icons", "icon-512.png");
mkdirSync(outDir, { recursive: true });

async function label(text, w = 200) {
  return sharp(
    Buffer.from(`<svg width="${w}" height="28" xmlns="http://www.w3.org/2000/svg">
      <text x="${w / 2}" y="20" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="600" fill="#475569">${text}</text>
    </svg>`),
  )
    .png()
    .toBuffer();
}

async function phoneSplash(w, h, deviceLabel) {
  const mark = await sharp(iconSrc).resize(112, 112).png().toBuffer();
  const copy = await sharp(
    Buffer.from(`<svg width="${w - 40}" height="150" xmlns="http://www.w3.org/2000/svg">
      <text x="${(w - 40) / 2}" y="40" text-anchor="middle" font-family="Arial Black, Helvetica, sans-serif" font-size="30" font-weight="800" fill="#09090b">ROVE<tspan fill="#7C3AED">X</tspan>O</text>
      <text x="${(w - 40) / 2}" y="78" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="3.5" fill="#71717A">BUY . SELL . GROW.</text>
      <circle cx="${(w - 40) / 2 - 12}" cy="112" r="3" fill="#7C3AED" opacity="0.4"/>
      <circle cx="${(w - 40) / 2}" cy="112" r="3" fill="#7C3AED" opacity="0.9"/>
      <circle cx="${(w - 40) / 2 + 12}" cy="112" r="3" fill="#7C3AED" opacity="0.4"/>
    </svg>`),
  )
    .png()
    .toBuffer();

  const bezel = 12;
  const inner = await sharp({
    create: {
      width: w - bezel * 2,
      height: h - bezel * 2,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: mark, top: Math.round((h - bezel * 2) * 0.3), left: Math.round((w - bezel * 2 - 112) / 2) },
      { input: copy, top: Math.round((h - bezel * 2) * 0.3) + 130, left: 8 },
    ])
    .png()
    .toBuffer();

  const phone = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 18, g: 18, b: 20 } },
  })
    .composite([{ input: inner, top: bezel, left: bezel }])
    .png()
    .toBuffer();

  const caption = await label(deviceLabel, w);
  return sharp({
    create: { width: w, height: h + 36, channels: 3, background: { r: 246, g: 247, b: 250 } },
  })
    .composite([
      { input: phone, top: 0, left: 0 },
      { input: caption, top: h + 6, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function tile(iconSize, caption, box = 160) {
  const icon = await sharp(iconSrc).resize(iconSize, iconSize).png().toBuffer();
  const captionBuf = await label(caption, box);
  return sharp({
    create: { width: box, height: box + 36, channels: 3, background: { r: 246, g: 247, b: 250 } },
  })
    .composite([
      { input: icon, top: Math.round((box - iconSize) / 2), left: Math.round((box - iconSize) / 2) },
      { input: captionBuf, top: box + 4, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function main() {
  const title = await sharp(
    Buffer.from(`<svg width="1280" height="70" xmlns="http://www.w3.org/2000/svg">
      <text x="640" y="32" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#0B1224">ROVEXO Official RX Icon — Final Polish Preview</text>
      <text x="640" y="58" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#64748B">ONE preview · awaiting user approval · no freeze yet</text>
    </svg>`),
  )
    .png()
    .toBuffer();

  const official = await tile(200, "Official RX Icon", 220);
  const splashPhone = await phoneSplash(280, 560, "Splash Screen");
  const iphone = await phoneSplash(280, 560, "iPhone");
  const samsung = await phoneSplash(280, 560, "Samsung");
  const pwa = await tile(72, "PWA Icon", 140);
  const favicon = await tile(32, "Browser Favicon", 140);

  await sharp({
    create: { width: 1280, height: 760, channels: 3, background: { r: 246, g: 247, b: 250 } },
  })
    .composite([
      { input: title, top: 16, left: 0 },
      { input: official, top: 100, left: 40 },
      { input: pwa, top: 380, left: 60 },
      { input: favicon, top: 380, left: 220 },
      { input: splashPhone, top: 100, left: 320 },
      { input: iphone, top: 100, left: 620 },
      { input: samsung, top: 100, left: 920 },
    ])
    .png()
    .toFile(join(outDir, "FINAL-splash-icon-preview.png"));

  console.log("OK — reports/rx-icon-polish-previews/FINAL-splash-icon-preview.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
